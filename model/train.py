"""
PhishGuard — Model Training Script
Trains a Random Forest classifier on URL features to detect phishing sites.
Run this once to generate model.pkl and scaler.pkl
"""

import re
import math
import pickle
import numpy as np
import pandas as pd
from urllib.parse import urlparse
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    accuracy_score, classification_report, roc_auc_score, confusion_matrix
)

# ─────────────────────────────────────────────
#  FEATURE EXTRACTION  (25 features)
# ─────────────────────────────────────────────

def extract_features(url: str) -> dict:
    """Extract 25 lexical + structural features from a URL string."""
    url = str(url)
    try:
        parsed = urlparse(url if url.startswith("http") else "http://" + url)
        domain = parsed.netloc or ""
        path   = parsed.path or ""
        query  = parsed.query or ""
    except Exception:
        domain = path = query = ""

    # character-level signals
    def entropy(s):
        if not s:
            return 0
        freq = [s.count(c) / len(s) for c in set(s)]
        return -sum(p * math.log2(p) for p in freq)

    suspicious_words = [
        "login", "signin", "secure", "account", "update",
        "verify", "banking", "paypal", "ebay", "amazon",
        "confirm", "password", "free", "lucky", "prize",
        "click", "here", "urgent", "limited", "offer"
    ]
    url_lower = url.lower()

    return {
        "url_length":            len(url),
        "domain_length":         len(domain),
        "path_length":           len(path),
        "num_dots":              url.count("."),
        "num_hyphens":           url.count("-"),
        "num_underscores":       url.count("_"),
        "num_slashes":           url.count("/"),
        "num_at":                url.count("@"),
        "num_question":          url.count("?"),
        "num_ampersand":         url.count("&"),
        "num_equals":            url.count("="),
        "num_digits":            sum(c.isdigit() for c in url),
        "num_special":           sum(not c.isalnum() for c in url),
        "has_ip":                int(bool(re.match(r'\d+\.\d+\.\d+\.\d+', domain))),
        "has_https":             int(url.startswith("https")),
        "domain_entropy":        round(entropy(domain), 4),
        "url_entropy":           round(entropy(url), 4),
        "subdomain_count":       max(0, len(domain.split(".")) - 2),
        "path_depth":            len([p for p in path.split("/") if p]),
        "query_length":          len(query),
        "has_suspicious_word":   int(any(w in url_lower for w in suspicious_words)),
        "suspicious_word_count": sum(url_lower.count(w) for w in suspicious_words),
        "digit_ratio":           round(sum(c.isdigit() for c in url) / max(len(url), 1), 4),
        "special_ratio":         round(sum(not c.isalnum() for c in url) / max(len(url), 1), 4),
        "domain_digit_count":    sum(c.isdigit() for c in domain),
    }


# ─────────────────────────────────────────────
#  SYNTHETIC DATASET  (since we have no CSV)
#  In production replace with real dataset e.g.
#  PhishTank / UCI Phishing Dataset
# ─────────────────────────────────────────────

def make_dataset(n=8000, seed=42):
    rng = np.random.RandomState(seed)

    legit_urls = [
        "https://www.google.com/search?q=python",
        "https://github.com/scikit-learn/scikit-learn",
        "https://stackoverflow.com/questions/12345",
        "https://docs.python.org/3/library/os.html",
        "https://www.amazon.in/dp/B08N5WRWNW",
        "https://www.youtube.com/watch?v=abc123def",
        "https://en.wikipedia.org/wiki/Machine_learning",
        "https://leetcode.com/problems/two-sum",
        "https://mail.google.com/mail/u/0/#inbox",
        "https://www.linkedin.com/in/anish-malu13",
    ]
    phish_urls = [
        "http://secure-paypal-login.xyz/account/verify?id=12345",
        "http://192.168.1.1/banking/signin.php?user=update",
        "http://amazon-offer-free-prize.tk/click-here-now",
        "http://login-verify-account-ebay.com/signin?confirm=1",
        "http://paypa1.secure-update.info/password/reset",
        "http://www.google.com.phishing-site.net/signin",
        "http://urgent-limited-offer-free-account.xyz/verify",
        "http://194.67.23.11/bank/login?secure=true&confirm=1",
        "http://facebook-login-secure.ml/account?update=1",
        "http://signin-apple-id-verify-account.info/confirm",
    ]

    rows, labels = [], []
    per_url = n // (len(legit_urls) + len(phish_urls))

    for url in legit_urls:
        for _ in range(per_url):
            f = extract_features(url)
            # add tiny noise so rows aren't identical
            for k in ["url_length", "num_digits", "query_length"]:
                f[k] = max(0, f[k] + rng.randint(-3, 4))
            rows.append(f); labels.append(0)

    for url in phish_urls:
        for _ in range(per_url):
            f = extract_features(url)
            for k in ["url_length", "num_digits", "query_length"]:
                f[k] = max(0, f[k] + rng.randint(-3, 4))
            rows.append(f); labels.append(1)

    df = pd.DataFrame(rows)
    df["label"] = labels
    return df


# ─────────────────────────────────────────────
#  TRAIN
# ─────────────────────────────────────────────

def train():
    print("Building dataset...")
    df = make_dataset(n=8000)

    X = df.drop("label", axis=1)
    y = df["label"]
    feature_names = list(X.columns)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s  = scaler.transform(X_test)

    print("Training Random Forest...")
    clf = RandomForestClassifier(
        n_estimators=200,
        max_depth=12,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )
    clf.fit(X_train_s, y_train)

    y_pred = clf.predict(X_test_s)
    y_prob = clf.predict_proba(X_test_s)[:, 1]

    acc   = accuracy_score(y_test, y_pred)
    auc   = roc_auc_score(y_test, y_prob)
    cm    = confusion_matrix(y_test, y_pred)
    fp    = cm[0][1]
    total_neg = cm[0].sum()
    fpr   = fp / total_neg if total_neg else 0

    print(f"\n✅ Accuracy : {acc:.4f}")
    print(f"✅ ROC-AUC  : {auc:.4f}")
    print(f"✅ False Positive Rate: {fpr:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=["Legitimate", "Phishing"]))

    # Save model artifacts
    with open("model/model.pkl",        "wb") as f: pickle.dump(clf,          f)
    with open("model/scaler.pkl",       "wb") as f: pickle.dump(scaler,       f)
    with open("model/feature_names.pkl","wb") as f: pickle.dump(feature_names, f)

    print("\n✅ Saved: model/model.pkl, model/scaler.pkl, model/feature_names.pkl")
    return clf, scaler, feature_names


if __name__ == "__main__":
    train()
