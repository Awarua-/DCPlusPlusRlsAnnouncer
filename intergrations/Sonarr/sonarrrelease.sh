#!/usr/bin/bash

SOURCE="${BASH_SOURCE[0]}"
while [ -h "$SOURCE" ]; do # resolve $SOURCE until the file is no longer a symlink
  DIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"
  SOURCE="$(readlink "$SOURCE")"
  [[ $SOURCE != /* ]] && SOURCE="$DIR/$SOURCE" # if $SOURCE was a relative symlink, we need to resolve it relative to the path where the symlink file was located
done
DIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"


DATE="$(echo date -d \"$sonarr_episodefile_episodeairdates\" +'%Y-%m-%dT%H:%M:%S+00:00')"
node $DIR/../../dcplusplusreleaseannouncer.js "$sonarr_episodefile_path" $(eval $DATE)
