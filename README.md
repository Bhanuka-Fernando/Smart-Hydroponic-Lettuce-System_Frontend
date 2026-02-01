# Smart Hydroponic Lettuce System — Mobile App (React Native + Expo)

This repository contains the **mobile application** for the Smart Hydroponic Lettuce System. The app provides a single, unified UI to access **four independent components** through microservice APIs.

## Components
1) **Leaf Health Detection**
   - Disease + nutrient deficiency classification
   - Tipburn detection + severity
   - Health Score (0–100) + status (OK / WATCH / ACT NOW)

2) **Spoilage Prediction**
   - Spoilage stage classification
   - Remaining days / shelf-life estimation

3) **Water Quality Detection**
   - Sensor-based analysis (pH, EC/TDS, temperature, etc.)
   - Water status + alerts

4) **Growth Monitoring & Weight Estimation**
   - Growth monitoring
   - Weight estimation / harvest readiness indicators

---

## Tech Stack
- **React Native** (Expo)
- **React Navigation** (Bottom Tabs + Stack)
- API calls via **fetch/axios** 
- **JavaScript or TypeScript** 

---

## Prerequisites
- Node.js (LTS recommended)
- npm or yarn
- Expo Go (phone testing) OR Android/iOS simulator

---

## Installation
```bash
git clone <YOUR_REPO_URL>
cd <YOUR_PROJECT_FOLDER>
npm install

