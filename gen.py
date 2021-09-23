import time
from telethon.sync import TelegramClient
from telethon.sessions import StringSession

select = " "

API_KEY = int(input("Enter API_KEY here: "))
API_HASH = input("Enter API_HASH here: ")

template = """
UserBot support: @userbotindo
            
<code>STRING_SESSION</code>: <code>{}</code>
⚠️ <b>Please be carefull to pass this value to third parties</b>"""

with TelegramClient(StringSession(), API_KEY, API_HASH) as client:
    session_string = client.session.save()
    saved_messages_template = "Telethon session" + template.format(session_string)
    print("\nGenerating String Session...\n")
    client.send_message("me", saved_messages_template, parse_mode="html")
    time.sleep(1)
    print("Your STRING_SESSION value have been sent to your Telegram Saved Messages")