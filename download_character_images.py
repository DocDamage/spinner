import os
import re
import time
import requests
from ddgs import DDGS

# Franchise and character mapping
CHARACTERS = {
    "DC": [
        "Superman", "Batman", "Wonder Woman", "The Flash", "Green Lantern",
        "Martian Manhunter", "Doctor Fate", "Darkseid", "Brainiac", "Reverse-Flash",
        "Doomsday", "Lex Luthor", "Sinestro", "Trigon", "Anti-Monitor", "Shazam",
        "Black Adam", "Aquaman", "Mera", "Zatanna", "John Constantine", "Supergirl",
        "Power Girl", "Cyborg", "Starfire", "Beast Boy", "Blue Beetle", "Booster Gold",
        "Green Arrow", "Black Canary", "Deathstroke", "Bane", "Poison Ivy", "Clayface",
        "Lobo", "Swamp Thing", "Firestorm", "Captain Atom", "Plastic Man", "Hawkgirl",
        "Red Tornado", "Cosmic Armor Superman", "Superboy-Prime", "Batman Hellbat",
        "Parallax Hal Jordan", "White Lantern Hal Jordan", "Flash Speed Force Avatar",
        "Raven", "Nightwing", "Red Hood", "Harley Quinn"
    ],
    "Marvel": [
        "Spider-Man", "Thor", "Hulk", "Iron Man", "Captain Marvel", "Doctor Strange",
        "Scarlet Witch", "Black Panther", "Wolverine", "Storm", "Thanos", "Doctor Doom",
        "Magneto", "Galactus", "Ultron", "Kang the Conqueror", "Silver Surfer", "Jean Grey",
        "Ghost Rider", "Deadpool", "Dormammu", "Miles Morales", "Cyclops", "Iceman",
        "Rogue", "Gambit", "Nightcrawler", "Shadowcat", "Magik", "Cable", "Bishop",
        "Apocalypse", "Mister Sinister", "Sentry", "Blue Marvel", "Nova", "Adam Warlock",
        "Black Bolt", "Medusa", "Moon Knight", "Daredevil", "Blade", "Hela",
        "Gorr the God Butcher", "Knull", "Namor", "Rune King Thor", "Old King Thor",
        "World Breaker Hulk", "Immortal Hulk", "God Emperor Doom", "Cosmic Ghost Rider",
        "Captain Universe Spider-Man", "Scarlet Witch House of M", "Phoenix Five Cyclops",
        "Venom", "Carnage", "Professor X", "Punisher", "Shang-Chi", "Luke Cage",
        "Iron Fist", "Psylocke", "Green Goblin", "Doctor Octopus", "Venom King in Black"
    ],
    "Dragon_Ball": [
        "Goku", "Vegeta", "Gohan", "Piccolo", "Frieza", "Cell", "Majin Buu", "Jiren",
        "Future Trunks", "Hit", "Fused Zamasu", "Android 17", "Android 18", "Bardock",
        "Gogeta Blue", "Vegito Blue", "Beast Gohan", "Orange Piccolo"
    ],
    "Naruto": [
        "Naruto Uzumaki", "Sasuke Uchiha", "Kakashi Hatake", "Madara Uchiha",
        "Kaguya Otsutsuki", "Minato Namikaze", "Itachi Uchiha", "Nagato", "Obito Uchiha",
        "Hashirama Senju", "Tobirama Senju", "Might Guy", "Baryon Mode Naruto",
        "Six Paths Sasuke", "DMS Kakashi", "Boruto Uzumaki", "Momoshiki Otsutsuki"
    ],
    "Bleach": [
        "Ichigo Kurosaki", "Sosuke Aizen", "Yhwach", "Rukia Kuchiki", "Byakuya Kuchiki",
        "Kenpachi Zaraki", "Kisuke Urahara", "Genryusai Yamamoto", "Toshiro Hitsugaya",
        "Retsu Unohana", "Mayuri Kurotsuchi", "Ulquiorra Cifer", "Grimmjow Jaegerjaquez",
        "Final Getsuga Ichigo"
    ],
    "One_Piece": [
        "Monkey D. Luffy", "Roronoa Zoro", "Blackbeard", "Kaido", "Sanji", "Shanks",
        "Trafalgar Law", "Portgas D. Ace", "Big Mom", "Kizaru", "Akainu",
        "Dracule Mihawk", "Gear 5 Luffy", "Hybrid Kaido"
    ],
    "Jujutsu_Kaisen": [
        "Satoru Gojo", "Ryomen Sukuna", "Yuta Okkotsu", "Maki Zenin", "Toji Fushiguro",
        "Mahito", "Heian Sukuna", "Awakened Gojo"
    ],
    "My_Hero_Academia": [
        "Deku", "All Might", "Tomura Shirasaki", "All For One", "Katsuki Bakugo",
        "Shoto Todoroki", "Endeavor"
    ],
    "Hunter_x_Hunter": ["Meruem", "Gon Freecss", "Killua Zoldyck", "Kurapika", "Hisoka"],
    "Invincible": ["Omni-Man", "Invincible", "Atom Eve", "Battle Beast", "Grand Regent Thragg"],
    "One_Punch_Man": ["Saitama", "Cosmic Fear Garou", "Garou", "Tatsumaki"],
    "Sonic": ["Sonic the Hedgehog", "Shadow the Hedgehog", "Archie Sonic", "Super Shadow"],
    "Star_Wars": ["Darth Vader", "Luke Skywalker", "Emperor Palpatine", "Yoda"],
    "Zelda": ["Link", "Ganondorf", "Princess Zelda", "Fierce Deity Link"],
    "Devil_May_Cry": ["Dante", "Sin Devil Trigger Dante", "Vergil", "Nero"],
    "Yu_Yu_Hakusho": ["Yusuke Urameshi", "Hiei", "Kurama", "Younger Toguro"],
    "Mortal_Kombat": ["Scorpion", "Sub-Zero", "Raiden"],
    "Other": [
        "Asta", "Yuno", "Yami Sukehiro", "Escanor", "Meliodas", "Ban", "Avatar Aang",
        "Avatar Korra", "Denji", "Makima", "Tanjiro Kamado", "Muzan Kibutsuji",
        "Natsu Dragneel", "Erza Scarlet", "Gilgamesh Fate", "Saber Fate", "Kratos",
        "DIO JoJo", "Jotaro Kujo", "Giorno Giovanna", "Enrico Pucci", "Pit Kid Icarus",
        "Palutena", "Sora Kingdom Hearts", "Riku Kingdom Hearts", "Kirby", "Meta Knight",
        "He-Man", "Skeletor", "Mega Man X", "Zero Mega Man", "Samurai Jack", "Aku",
        "Leonardo TMNT", "Shredder TMNT", "Gandalf", "Sauron", "Neo The Matrix",
        "Agent Smith", "Optimus Prime", "Megatron", "Doctor Manhattan", "Asura Wrath",
        "Bayonetta", "Ben Tennyson", "Doom Slayer", "Danny Phantom", "Hellboy",
        "Sephiroth", "Lightning Final Fantasy", "Noctis Lucis Caelum", "Generator Rex",
        "Bill Cipher", "Master Chief Halo", "Alucard Hellsing", "Spawn Comic",
        "Bowser", "Raiden Metal Gear", "Samus Aran", "Shigeo Kageyama", "Mewtwo",
        "She-Ra", "Alex Mercer", "Sailor Moon", "Sung Jinwoo", "Steven Universe",
        "Rimuru Tempest", "Homelander", "Anos Voldigoad", "Lord Voldemort", "Cole MacGrath"
    ]
}

OUTPUT_BASE_DIR = "character_images"
MANIFEST_FILE = "character_image_manifest.js"

def sanitize_filename(name: str) -> str:
    return re.sub(r'[\\/*?:"<>|]', "", name).replace(" ", "_")

def download_character_image(franchise: str, character_name: str, session: requests.Session):
    folder_path = os.path.join(OUTPUT_BASE_DIR, franchise)
    os.makedirs(folder_path, exist_ok=True)
    clean_name = sanitize_filename(character_name)
    target_file = os.path.join(folder_path, f"{clean_name}.png")
    if os.path.exists(target_file):
        print(f"[-] Already exists: {character_name}")
        return
    query = f"{character_name} {franchise} official render transparent png"
    print(f"[+] Searching image for: {character_name}...", flush=True)
    try:
        with DDGS() as ddgs:
            results = list(ddgs.images(query, max_results=3))
        if not results:
            print(f" [!] No results found for: {character_name}")
            return
        for res in results:
            image_url = res.get("image")
            if not image_url:
                continue
            try:
                response = session.get(image_url, timeout=10)
                if response.status_code == 200 and len(response.content) > 5000:
                    with open(target_file, "wb") as f:
                        f.write(response.content)
                    print(f" [OK] Saved: {target_file}")
                    return
            except Exception:
                continue
        print(f" [!] Failed to download valid image for: {character_name}")
    except Exception as e:
        print(f" [X] Search error for {character_name}: {e}")

def write_character_manifest():
    """Write the local image inventory consumed by the standalone game."""
    entries = []
    for root, _, files in os.walk(OUTPUT_BASE_DIR):
        for filename in sorted(files):
            if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.webp', '.gif')):
                full_path = os.path.join(root, filename)
                relative_path = os.path.relpath(full_path, OUTPUT_BASE_DIR).replace(os.sep, '/')
                franchise = os.path.basename(os.path.dirname(full_path))
                entries.append({
                    "path": f"{OUTPUT_BASE_DIR}/{relative_path}",
                    "folder": franchise,
                    "name": os.path.splitext(filename)[0].replace('_', ' ')
                })
    manifest = "window.CHARACTER_IMAGE_MANIFEST=" + repr(entries) + ";\n"
    with open(MANIFEST_FILE, "w", encoding="utf-8") as output:
        output.write(manifest)
    print(f"[OK] Wrote {len(entries)} image mappings to {MANIFEST_FILE}")

def main():
    os.makedirs(OUTPUT_BASE_DIR, exist_ok=True)
    write_character_manifest()
    session = requests.Session()
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    })
    for franchise, chars in CHARACTERS.items():
        print(f"\n==========================================")
        print(f" Processing Franchise: {franchise.replace('_', ' ')} ({len(chars)} characters)")
        print(f"==========================================")
        for char in chars:
            download_character_image(franchise, char, session)
            time.sleep(0.8)
            write_character_manifest()
    print("\n[OK] All downloads complete! Check the 'character_images' folder.")

if __name__ == "__main__":
    main()
