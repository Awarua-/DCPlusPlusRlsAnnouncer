## DCPlusPlusRlsAnnouncer

Used to send a generated magnetic link to a specified DC++ hub.<br>
Using the sickbeard and couchpotato plugins magnetic links are posted upon download and processing completion

This project makes use of the [tthJava](https://github.com/Awarua-/tthJava) generated jar to get a tth hash for a given file. This is required for a magnetic link when releasing to a DC++ hub.

## Installing
### Dependencies
Node / npm
Java

### Instructions
run npm install
setup relevant intergrations
Create config.json

### Intergrations

#### CouchPotato

#### Sickbeard

#### Sonarr

### Config
Below is an example config

Password and daysElapsed are optional<br>
daysElapsed defaults to 16
```
{
    "nick": "Awarua_rlsbot",
    "address": "limitless.no-ip.org",
    "password": "<optional>",
    "port": 40404,
    "daysElapsed": 16
    "types": [
        {
            "path": "/nfs/Media/Anime",
            "type": "Anime"
        },
        {
            "path": "/nfs/Media/Tv",
            "type": "TV"
        },
        {
            "path": "/nfs/Media/HD Movies",
            "type": "Movies"
        },
        {
            "path": "/nfs/Media/Documentaries",
            "type": "Documentaries"
        },
        {
            "path": "/nfs/Media/Music",
            "type": "Music"
        }
    ]
}
```


## License and Contributions
This program is licensed under the MIT license. Pull requests and contributions welcome.
