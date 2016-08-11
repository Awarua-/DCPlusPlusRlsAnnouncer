$rawDate = $env:sonarr_episodefile_episodeairdates -replace "\.", ""
$dateObject = ([datetime]::ParseExact($rawDate, "dd/MM/yyyy h:mm:ss tt", $null))
$DATE = "{0:yyyy-MM-ddTHH:mm:ss+00:00}" -f [datetime]$dateObject
node $PSScriptRoot/../../dcplusplusreleaseannouncer.js "$env:sonarr_episodefile_path" $DATE
