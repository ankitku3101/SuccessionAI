# 🚀 SuccessionAI Team Setup & Workflow Guide

This guide explains how to work safely with our **Turborepo using npm** while avoiding `package-lock.json` conflicts and keeping Git history clean.

---

## One-time setup (per developer)

Run these commands **once on your machine**:

```bash
# Prevent merge conflicts for package-lock.json
git config --global merge.ours.driver true

# Make git pull automatically rebase
git config --global pull.rebase true
```
After every pull, do **npm install**