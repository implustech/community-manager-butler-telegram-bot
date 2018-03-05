# MW Butler Telegram Bot


## Features

Automatically deletion of messages containing:

- ETH addresses
- images/stickers/gifs/videos
- urls or email addresses

After a configurable number of violations (i.e.: the user got their message deleted _n_ times), the bot will automatically kick the users out of the group for a limited amount of time, or indefinitely ban them.

Configurations are group-specific.

The bot is also capable of muting groups, that is, any message will be deleted with the exception of those posted by group administrators.



## Available commands

| Command | Description |
| --------| ----------- |
| `/config get` | Gets the current configuration of the group  |
| `/config set kick after {insert number} violations` | Set the number of allowed violations before kicking the user |
| `/config set ban after {insert number} violations` | Set the number of allowed violations before banning the user |
| `/mute` | Mute the group |
| `/unmute` | Unmute the group |


Note that any attempt from a regular user to invoke Bot's command will be reported to admins by the bot itself.


## Running the bot

To run the bot:
```sh
cd /path/to/repo
export TELEGRAM_TOKEN=534xxxxxx:AAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxgVI
docker-compose up --build -d
```
