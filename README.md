# Stream Sync

Stream Sync is a React Native application designed for seamless 1-1 video calling. It leverages WebRTC for real-time video synchronization and Firebase as signaling server.

[<img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" alt="Get it on Google Play" height="80">](https://play.google.com/store/apps/details?id=com.streamsync)

## Features

- 1-1 Video Calling

## Getting Started

### Prerequisites

- Node.js and npm installed
- React Native development environment set up
- Firebase account for authentication

### Installation

1. Clone the repository:

```bash
git clone https://github.com/khadeshyam/Stream-Sync.git
cd stream-sync
```

2. Install dependencies:

```bash
yarn
```
3. Set up Firebase:

- Create a Firebase project on the Firebase Console.
- Add an Android app to your project.
- Download the google-services.json file from the Firebase Console.
- Place the google-services.json file in the android/app directory of your React Native project.


4. Start the app:

```bash
npm start
```

## Usage

- Launch the app on two separate devices.
- Initiate a call or accept an incoming call to start the 1-1 video conversation.

## Contributing

1. Fork the repository.
2. Create a new branch: `git checkout -b feature/new-feature`.
3. Make your changes and commit: `git commit -m 'Add new feature'`.
4. Push to the branch: `git push origin feature/new-feature`.
5. Submit a pull request.
