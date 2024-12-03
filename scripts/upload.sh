#!/bin/bash

OP_URL="https://nextcloud.openproject.org"
NC_DAV_PATH="remote.php/dav/files"
UPLOAD_FOLDER="PDF/training/final"
TEMP_UPLOAD_FOLDER="PDF/training/temp"

shopt -s globstar nullglob

FILES=(./exports/**/*.pdf ./exports/**/*.zip)

USER=$1
PASS=$2

if [ -z "$USER" ]; then
USER=$NEXTCLOUD_USERNAME
fi

if [ -z "$PASS" ]; then
PASS=$NEXTCLOUD_APP_ACCESS_KEY
fi

function print_usage() {
  cat <<EOF
USAGE:
  $0 <nextcloud user name> <nextcloud password>
ERROR:
EOF
}

function throw_if_empty() {
  local name="$1"
  local value="$2"
  if [ -z "$value" ]; then
    print_usage
    echo "  Parameter $name are empty." 1>&2
    exit -1
  fi
}

throw_if_empty "1 (user name) and ENV[NEXTCLOUD_USERNAME]" $USER
throw_if_empty "2 (password) and ENV[NEXTCLOUD_APP_ACCESS_KEY]" $PASS

function get_folder_path() {
  local FOLDER_PATH="$1"

  response_code=$(curl -s -o /dev/null -w "%{http_code}" -u "$USER:$PASS" "$OP_URL/$NC_DAV_PATH/$USER/$FOLDER_PATH" -X GET)

  if [ "$response_code" == "404" ]; then
    resp_code=$(curl -s -o /dev/null -w "%{http_code}" -u "$USER:$PASS" "$OP_URL/$NC_DAV_PATH/$USER/$FOLDER_PATH" -X MKCOL)
    if [ "$resp_code" != "201" ]; then
      echo "Failed to create folder $FOLDER_PATH."
      exit -1
    fi
  fi

  echo "${OP_URL}/${NC_DAV_PATH}/${USER}/${FOLDER_PATH}"
}

function get_file_prefix() {
  local branch_name="$1"

  file_prefix=$(echo "$branch_name" | sed 's/[#*|\\:'"'"'"/?<>]/-/g')
  temp_filename="${file_prefix}_${filename}"
  mv "${filename}" "${temp_filename}"
  echo "$temp_filename"
}

function delete_temp_pdf() {
  commit_subject=$(git log -1 --pretty=format:%s)
  regex='Merge pull request #[0-9]+ from opf/(.+)$'
  [[ $commit_subject =~ $regex ]]
  branch_name=${BASH_REMATCH[1]}

  temp_filename=$(get_file_prefix "$branch_name")
  echo "Deleting temporary pdf file $temp_filename"
  response_code=$(curl -s -o /dev/null -w "%{http_code}" -u "$USER:$PASS" "$OP_URL/$NC_DAV_PATH/$USER/$TEMP_UPLOAD_FOLDER/$temp_filename" -X GET)
  if [ "$response_code" == "200" ]; then
    resp_code=$(curl -s -o /dev/null -w "%{http_code}" -u "$USER:$PASS" "$OP_URL/$NC_DAV_PATH/$USER/$TEMP_UPLOAD_FOLDER/$temp_filename" -X DELETE)
    if [ "$resp_code" != "204" ]; then
      echo "Failed to delete file $temp_filename."
    fi
  fi
}

for f in "${FILES[@]}"
do
  filename="${f##*/}"

  if [ "$GITHUB_EVENT_NAME" = "pull_request" ]; then
    if [ "${f##*.}" = "zip" ]; then
      continue
    fi
    temp_filename=$(get_file_prefix "$GITHUB_HEAD_REF")
    destination="$(get_folder_path "$TEMP_UPLOAD_FOLDER")/${temp_filename}"
  else
    delete_temp_pdf
    destination="$(get_folder_path "$UPLOAD_FOLDER")/${filename}"
  fi

  echo "Uploading $filename"
  wget --auth-no-challenge --method=PUT --user="$USER" --password="$PASS" --body-file "$f" "$destination"
  body='<?xml version="1.0"?>
        <d:propfind xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns" xmlns:nc="http://nextcloud.org/ns">
          <d:prop>
              <oc:fileid />
            </d:prop>
        </d:propfind>'
  propfind_response=$(curl -kv -XPROPFIND -u "$USER:$PASS" "$destination" -d "$body")
  file_id=$(echo "$propfind_response" | grep -oP '<oc:fileid>\K[^<]+')
  echo "👀 ${f##*.} Preview for \`$filename\` can be previewed in [Temporary ${f##*.}]($OP_URL/f/$file_id)" >> ./scripts/comment.txt
done