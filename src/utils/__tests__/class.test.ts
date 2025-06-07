import { describe, it, expect } from "vitest";
import { cn } from "../class";

describe("cn utility function", () => {
  it("should merge class names correctly", () => {
    const result = cn("px-2 py-1", "px-4");
    expect(result).toBe("py-1 px-4");
  });

  it("should handle conditional classes", () => {
    const result = cn("base-class", true && "conditional-class", false && "hidden-class");
    expect(result).toBe("base-class conditional-class");
  });

  it("should handle empty input", () => {
    const result = cn();
    expect(result).toBe("");
  });

  it("should handle undefined and null values", () => {
    const result = cn("valid-class", undefined, null, "another-class");
    expect(result).toBe("valid-class another-class");
  });

  it("should handle array of classes", () => {
    const result = cn(["class1", "class2"], "class3");
    expect(result).toBe("class1 class2 class3");
  });

  it("should handle object with boolean values", () => {
    const result = cn({
      active: true,
      inactive: false,
      visible: true,
    });
    expect(result).toBe("active visible");
  });

  it("should merge tailwind conflicting classes", () => {
    const result = cn("text-red-500", "text-blue-500");
    expect(result).toBe("text-blue-500");
  });
});
