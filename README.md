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
Modify the following in your sickbeard config file
`extra_scripts = "python <path to releaser script>\DCPlusPlusRlsAnnouncer-master\intergrations\SickBeard\sickbeardAnnounce.py"`  
For more info on extra scripts in sickbeard see [here](https://code.google.com/archive/p/sickbeard/wikis/AdvancedSettings.wiki)

#### Sonarr

Setup a new connection as a custom script under the settings menu  
Supported commands are `On Download` and `On Upgrade`  
Set the Path to be: `<Path to node excuteable>`  
Set the Arguments to be: `<installDir>/dcplusplusrlsannouncer.js`

### Config
Below is an example config

password, daysElapsed and slient are optional<br>
password defaults to empty string ""  
daysElapsed defaults to 16  
slient defaults to false  
type defaults to Other if no type maps are specified.  
NB: paths in windows are required to be escaped.  
```js
{
    "nick": "my_rlsbot",
    "address": "mydcplusplusserver.com",
    "password": "Password",
    "port": 1234,
    "daysElapsed": 16,
    "silent": true,
    "types": [
        {
            "path": "/nfs/Media/Anime",
            "type": "Anime"
        },
        {
            "path": "Z:\\Media\\Tv",
            "type": "TV"
        }
    ]
}
```


## License and Contributions
This program is licensed under the MIT license. Pull requests and contributions welcome.
