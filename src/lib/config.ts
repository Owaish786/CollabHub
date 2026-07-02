const LOCAL_MONGO_URI = "mongodb://127.0.0.1:27017/collabhub";

function isPlaceholderMongoUri(mongoUri: string | undefined) {
  if (!mongoUri) {
    return true;
  }

  return (
    mongoUri.includes("username:password@cluster.mongodb.net/collabhub") ||
    mongoUri.includes("your-mongo") ||
    mongoUri.includes("example")
  );
}

export function resolveMongoUri() {
  const mongoUri = process.env.MONGODB_URI;

  if (isPlaceholderMongoUri(mongoUri)) {
    return {
      uri: LOCAL_MONGO_URI,
      usingFallback: true,
      warning:
        "Using local MongoDB fallback because MONGODB_URI is still a placeholder.",
    };
  }

  return {
    uri: mongoUri as string,
    usingFallback: false,
  };
}