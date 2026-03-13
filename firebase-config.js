const firebaseConfig = {
  apiKey:            "AIzaSyA36ZuIsfkpNeIj8_MY-GrDV7fLsrrquZ8",
  authDomain:        "influencer-crm-56e8d.firebaseapp.com",
  projectId:         "influencer-crm-56e8d",
  storageBucket:     "influencer-crm-56e8d.firebasestorage.app",
  messagingSenderId: "559059391054",
  appId:             "1:559059391054:web:2dfb88fbf3a9fb7057e91f"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db   = firebase.firestore();
