jest.mock("mongodb", () => {
  const mCollection = {};
  const mDb = { collection: jest.fn(() => mCollection) };
  const mClient = {
    connect: jest.fn(),
    db: jest.fn(() => mDb),
  };
  const MongoClient = jest.fn(() => mClient);

  return { MongoClient };
});

describe("MongoDB connection module", () => {
  const collectionName = "testCollection";

  let connect, MongoClient;

  beforeEach(() => {
    jest.resetModules();

    // Re-import fresh modules after resetModules
    ({ connect } = require("@services/db"));
    ({ MongoClient } = require("mongodb"));

    jest.clearAllMocks();
  });

  test("connect should create MongoClient and connect", async () => {
    const collection = await connect(collectionName);

    // Now get the mock client from constructor call results
    const mClient = MongoClient.mock.results[0].value;

    expect(MongoClient).toHaveBeenCalledTimes(1);
    expect(mClient.connect).toHaveBeenCalledTimes(1);
    expect(mClient.db).toHaveBeenCalledWith(process.env.DB_NAME || "dev_db");
    expect(mClient.db().collection).toHaveBeenCalledWith(collectionName);
    expect(collection).toBeDefined();
  });

  test("connect returns cached collection on subsequent calls", async () => {
    const first = await connect(collectionName);
    const second = await connect(collectionName);

    const mClient = MongoClient.mock.results[0].value;

    expect(MongoClient).toHaveBeenCalledTimes(1);
    expect(mClient.connect).toHaveBeenCalledTimes(1);
    expect(mClient.db().collection).toHaveBeenCalledTimes(1);
    expect(first).toBe(second);
  });

  test("connect creates new client when client is undefined", async () => {
    jest.resetModules(); // Clear module cache, so client is undefined

    const { connect } = require("@services/db");
    const { MongoClient } = require("mongodb");

    const collection = await connect("someCollection");

    const mClient = MongoClient.mock.results[0].value;

    expect(MongoClient).toHaveBeenCalledTimes(1);
    expect(mClient.connect).toHaveBeenCalledTimes(1);
    expect(collection).toBeDefined();
  });
});
