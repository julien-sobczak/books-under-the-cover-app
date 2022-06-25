import json
import sys
import re
from collections import Counter

if len(sys.argv) != 2:
    print("""
Output a compressed JSON file.

Usage: python3 min.py file.json > file.min.json
""")
    sys.exit(0)

with open(sys.argv[1], "r", encoding="utf-8") as json_file:
    data = json.load(json_file)

    # Find the most popular genres (or use a static list, probably simpler)
    genres = Counter()
    for entry in data:
        if "genres" in entry:
            for genre in entry["genres"]:
                genres[genre] += 1

    popular_genres_count = genres.most_common(25)
    ignored_genres = ["Adult", "Biography Memoir", "Personal Development", "Audiobook"]
    popular_genres = [name for (name, count) in popular_genres_count]
    popular_genres = filter(lambda name: name not in ignored_genres, popular_genres)

    new_data = []
    for entry in data:
        if not entry["book_file"].endswith(".epub"):
            continue
        slug = entry["book_file"].rstrip(".epub")
        entry["slug"] = slug
        del entry["filename"]
        del entry["cover_file"]
        del entry["book_file"]
        new_genres = []
        for genre in entry["genres"]:
            if genre in popular_genres:
                new_genres.append(genre)
        entry["genres"] = new_genres
        new_data.append(entry)
    result = json.dumps(data, separators=(',', ':'))
    result = re.sub('([\d+][.]\d\d)\d+', '\1', result)
    print(result)
