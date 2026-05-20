"""
features.py — URL feature extraction
Shared by training script and FastAPI app.
"""

import re
import math
from urllib.parse import urlparse


SUSPICIOUS_WORDS = [
    "login", "signin", "secure", "account", "update",
    "verify", "banking", "paypal", "ebay", "amazon",
    "confirm", "password", "free", "lucky", "prize",
    "click", "here", "urgent", "limited", "offer"
]

FEATURE_NAMES = [
    "url_length", "domain_length", "path_length", "num_dots",
    "num_hyphens", "num_underscores", "num_slashes", "num_at",
    "num_question", "num_ampersand", "num_equals", "num_digits",
    "num_special", "has_ip", "has_https", "domain_entropy",
    "url_entropy", "subdomain_count", "path_depth", "query_length",
    "has_suspicious_word", "suspicious_word_count", "digit_ratio",
    "special_ratio", "domain_digit_count",
]


def _entropy(s: str) -> float:
    if not s:
        return 0.0
    freq = [s.count(c) / len(s) for c in set(s)]
    return -sum(p * math.log2(p) for p in freq)


def extract(url: str) -> list:
    """Return a list of 25 numeric features for a given URL."""
    url = str(url)
    try:
        parsed = urlparse(url if url.startswith("http") else "http://" + url)
        domain = parsed.netloc or ""
        path   = parsed.path   or ""
        query  = parsed.query  or ""
    except Exception:
        domain = path = query = ""

    url_lower = url.lower()

    f = [
        len(url),
        len(domain),
        len(path),
        url.count("."),
        url.count("-"),
        url.count("_"),
        url.count("/"),
        url.count("@"),
        url.count("?"),
        url.count("&"),
        url.count("="),
        sum(c.isdigit() for c in url),
        sum(not c.isalnum() for c in url),
        int(bool(re.match(r'\d+\.\d+\.\d+\.\d+', domain))),
        int(url.startswith("https")),
        round(_entropy(domain), 4),
        round(_entropy(url), 4),
        max(0, len(domain.split(".")) - 2),
        len([p for p in path.split("/") if p]),
        len(query),
        int(any(w in url_lower for w in SUSPICIOUS_WORDS)),
        sum(url_lower.count(w) for w in SUSPICIOUS_WORDS),
        round(sum(c.isdigit() for c in url) / max(len(url), 1), 4),
        round(sum(not c.isalnum() for c in url) / max(len(url), 1), 4),
        sum(c.isdigit() for c in domain),
    ]
    return f
