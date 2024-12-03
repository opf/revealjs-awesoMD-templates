#!/bin/bash

for markdown_file in $CHANGED_MARKDOWN_FILES; do
  file_name=$(basename $markdown_file)

  # start server
  pnpm start $file_name &

  # wait for server
  wait-for-it -h localhost -p 8000 -t 5

  # grant write permission
  chmod o+w .

  # set the maximum number of entries
  max_retries=3

  #initialize retry count
  retry_count=0

  while [ $retry_count -lt $max_retries ]; do
    # generate pdf
    pnpm export-pdf

    # check for pdf
    if [ -e "exports/${file_name%.md}/${file_name%.md}.pdf" ]; then
      break
    fi

    # increment retry count
    ((retry_count++))

    # output retry information
    echo "Retry $retry_count: PDF not found, retrying..."

    # sleep for a short duration before retrying
    sleep 1
  done

  # check if all retries failed
  if [ $retry_count -eq $max_retries ]; then
    echo "Maximum retries reached. PDF not created after $max_retries attempts."
    exit 1
  fi
  if [ "$GITHUB_EVENT_NAME" != "pull_request" ]; then
    pnpm export-html
  fi

  # stop server
  PID=$(lsof -t -i:8000)
  kill $PID

  if [ -n "$PID" ]; then
      # Wait for the process to exit gracefully
      sleep 5

      # Check if the process is still running
      if ps -p $PID > /dev/null; then
          # Send SIGKILL signal to forcefully terminate the process
          kill -9 $PID
      fi
  fi
done
