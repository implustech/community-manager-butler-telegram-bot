module.exports.messages = {
    ethAddresses: {
        good: [{
            'message_id': 245,
            'from': {
                'id': 29792731,
                'is_bot': false,
                'first_name': 'name',
                'last_name': 'last-name',
                'username': 'testname',
                'language_code': 'en-US'
            },
            'chat': {
                'id': -314643847,
                'title': 'test-group',
                'type': 'group',
                'all_members_are_administrators': false
            },
            'date': 1519636358,
            'text': 'Nice message'
        }],
        bad: [{
            'message_id': 245,
            'from': {
                'id': 29792731,
                'is_bot': false,
                'first_name': 'name',
                'last_name': 'last-name',
                'username': 'testname',
                'language_code': 'en-US'
            },
            'chat': {
                'id': -314643847,
                'title': 'test-group',
                'type': 'group',
                'all_members_are_administrators': false
            },
            'date': 1519636358,
            'text': 'ETH giveaway! Send 0.05 ETH to 0x32be343b94f860124dc4fee278fdcbd38c102d88 then check your balance in 2 hours'
        }]
    },
    images: {
        good: [{
            'message_id': 246,
            'from': {
                'id': 29792731,
                'is_bot': false,
                'first_name': 'name',
                'last_name': 'last-name',
                'username': 'testname',
                'language_code': 'en-US'
            },
            'chat': {
                'id': -314643847,
                'title': 'test-group',
                'type': 'group',
                'all_members_are_administrators': false
            },
            'date': 1519637579
        }],
        bad: [{
            'message_id': 246,
            'from': {
                'id': 29792731,
                'is_bot': false,
                'first_name': 'name',
                'last_name': 'last-name',
                'username': 'testname',
                'language_code': 'en-US'
            },
            'chat': {
                'id': -314643847,
                'title': 'test-group',
                'type': 'group',
                'all_members_are_administrators': false
            },
            'date': 1519637579,
            'photo': [{
                'file_id': 'AgADBAADeKwxGwZ5oFCNYKuHo6zII1MnIBoABDj07fo96KazCWcFAAEC',
                'file_size': 1223,
                'width': 90,
                'height': 63
            },
            {
                'file_id': 'AgADBAADeKwxGwZ5oFCNYKuHo6zII1MnIBoABI9PoPgdeRR2CGcFAAEC',
                'file_size': 4615,
                'width': 166,
                'height': 117
            }
            ]
        }]
    },
    urls: {
        good: [],
        bad: [{
            'message_id': 247,
            'from': {
                'id': 29792731,
                'is_bot': false,
                'first_name': 'name',
                'last_name': 'last-name',
                'username': 'testname',
                'language_code': 'en-US'
            },
            'chat': {
                'id': -314643847,
                'title': 'test-group',
                'type': 'group',
                'all_members_are_administrators': false
            },
            'date': 1519637863,
            'text': 'https://name.com',
            'entities': [{
                'offset': 0,
                'length': 19,
                'type': 'url'
            }]
        }]
    },
    emails: {
        good: [],
        bad: [{
            'message_id': 248,
            'from': {
                'id': 29792731,
                'is_bot': false,
                'first_name': 'name',
                'last_name': 'last-name',
                'username': 'testname',
                'language_code': 'en-US'
            },
            'chat': {
                'id': -314643847,
                'title': 'test-group',
                'type': 'group',
                'all_members_are_administrators': false
            },
            'date': 1519637983,
            'text': 'name@gmail.com',
            'entities': [{
                'offset': 0,
                'length': 17,
                'type': 'email'
            }]
        }]
    },
    stickers: {
        good: [],
        bad: [{
            'message_id': 249,
            'from': {
                'id': 29792731,
                'is_bot': false,
                'first_name': 'name',
                'last_name': 'last-name',
                'username': 'testname',
                'language_code': 'en-US'
            },
            'chat': {
                'id': -314643847,
                'title': 'test-group',
                'type': 'group',
                'all_members_are_administrators': false
            },
            'date': 1519638069,
            'sticker': {
                'width': 450,
                'height': 512,
                'emoji': '😏',
                'set_name': 'TelegramGreatMinds',
                'thumb': {
                    'file_id': 'AAQEABPpxmEwAAQQpKNnBDCFoAtjAAIC',
                    'file_size': 2368,
                    'width': 79,
                    'height': 90
                },
                'file_id': 'CAADBAADGgADyIsGAAHw_WAnR5mwUAI',
                'file_size': 37984
            }
        }]
    },
    gifs: {
        good: [],
        bad: [{
            'message_id': 250,
            'from': {
                'id': 29792731,
                'is_bot': false,
                'first_name': 'name',
                'last_name': 'last-name',
                'username': 'testname',
                'language_code': 'en-US'
            },
            'chat': {
                'id': -314643847,
                'title': 'test-group',
                'type': 'group',
                'all_members_are_administrators': false
            },
            'date': 1519638115,
            'document': {
                'file_name': 'tenor.gif.mp4',
                'mime_type': 'video/mp4',
                'thumb': {
                    'file_id': 'AAQEABOIaV4ZAARupLJQ19FMfvk0AQABAg',
                    'file_size': 1765,
                    'width': 64,
                    'height': 90
                },
                'file_id': 'CgADBAADhwMAAgZ5oFDgWG_hIwdDDgI',
                'file_size': 40901
            }
        }]
    }
}
