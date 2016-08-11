## DCPlusPlusRlsAnnouncer

Used to send a generated magnetic link to a specified DC++ hub.<br>
Using the sonarr, sickbeard and couchpotato plugins magnetic links are posted upon download and processing completion

This project makes use of the [tthJava](https://github.com/Awarua-/tthJava) generated jar to get a tth hash for a given file. This is required for a magnetic link when releasing to a DC++ hub.

## Installing
### Dependencies
* Node >= 4.0.0
* npm
* Java, >= 1.8
* node, npm, java in Path

### Instructions
* run npm install
* setup relevant intergrations
* create config.json

### Intergrations

#### CouchPotato
Support for Couchpotato is still in development, last working version present in repo

#### Sickbeard
Support for Sickbeard has been dropped, last working version present in repo

#### Sonarr

Setup a new connection as a custom script under the settings menu  
Supported commands are `On Grab` and `On Upgrade`  
Set the path to be:`<installDir>/intergrations/Sonarr/sonarrrelease.[ps1,sh]`

### Config
Below is an example config

password and daysElapsed are optional<br>
daysElapsed defaults to 16  
type defaults to Other if no type maps are specified.
```js
{
    "nick": "my_rlsbot",
    "address": "mydcplusplusserver.com",
    "password": "Password",
    "port": 1234,
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
