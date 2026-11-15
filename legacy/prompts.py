import random

PROMPTS = [
    "What made you smile today?",
    "Show us something on your desk right now.",
    "Sing the song stuck in your head today.",
    "Share one thing you're looking forward to.",
    "What's the best thing you ate so far?",
    "Describe your day in one run-on sentence.",
    "What's something small you did today that you're proud of?",
    "What's the view from where you are right now?",
    "Tell us about someone who helped you recently.",
    "What's one thing you want to try this month?",
    "Show us your favorite spot on campus.",
    "What's the last thing that made you giggle?",
    "Pick your own prompt!",
    "Describe the plot of a movie without using any audio.",
    "Between us, who would be the hero(s) and who would be the sidekick(s)?",
]


def random_prompt() -> str:
    return random.choice(PROMPTS)
