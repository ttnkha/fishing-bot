jest.mock("@services/db");

const { connect } = require("@services/db");
const { loadData, saveData } = require("@services/data");

describe("Data Utilities", () => {
  const mockCollection = {
    findOne: jest.fn(),
    updateOne: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    connect.mockResolvedValue(mockCollection);
  });

  describe("loadData", () => {
    test("returns the value when document is found", async () => {
      mockCollection.findOne.mockResolvedValue({ _id: "abc", value: "testValue" });
      const result = await loadData("abc");
      expect(connect).toHaveBeenCalledWith("dev_data");
      expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: "abc" });
      expect(result).toBe("testValue");
    });

    test("returns undefined when document is not found", async () => {
      mockCollection.findOne.mockResolvedValue(null);
      const result = await loadData("missingId");
      expect(result).toBeUndefined();
    });
  });

  describe("saveData", () => {
    test("updates or inserts the document correctly", async () => {
      await saveData("abc", { a: 1, b: 2 });
      expect(connect).toHaveBeenCalledWith("dev_data");
      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { _id: "abc" },
        { $set: { value: { a: 1, b: 2 } } },
        { upsert: true }
      );
    });
  });
});
