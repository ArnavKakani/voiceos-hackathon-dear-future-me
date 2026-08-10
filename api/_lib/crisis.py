CRISIS_RESOURCES = {
    "us": {
        "region": "United States",
        "emergency": "Call 911 if there is immediate danger.",
        "resources": [
            {
                "name": "988 Suicide & Crisis Lifeline",
                "phone": "988",
                "text": "Text 988",
                "url": "https://988lifeline.org/",
            },
            {
                "name": "Crisis Text Line",
                "text": "Text HOME to 741741",
                "url": "https://www.crisistextline.org/",
            },
        ],
    },
    "ca": {
        "region": "Canada",
        "emergency": "Call 911 if there is immediate danger.",
        "resources": [
            {
                "name": "9-8-8 Suicide Crisis Helpline",
                "phone": "988",
                "text": "Text 988",
                "url": "https://988.ca/",
            }
        ],
    },
    "uk": {
        "region": "United Kingdom",
        "emergency": "Call 999 or 112 if there is immediate danger.",
        "resources": [
            {
                "name": "Samaritans",
                "phone": "116 123",
                "url": "https://www.samaritans.org/",
            }
        ],
    },
}


def resources_for(region: str) -> dict:
    key = region.strip().lower()
    if key in CRISIS_RESOURCES:
        return CRISIS_RESOURCES[key]
    return {
        "region": region,
        "emergency": "Contact your local emergency services if there is immediate danger.",
        "resources": [
            {
                "name": "Find a Helpline",
                "url": "https://findahelpline.com/",
            }
        ],
    }
