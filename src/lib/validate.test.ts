import { describe, it, expect } from "vitest";
import { validateDomain, isPrivateIp } from "./validate";

describe("validateDomain", () => {
  it("accepts valid domains", () => {
    expect(validateDomain("example.com").valid).toBe(true);
    expect(validateDomain("sub.example.co.uk").valid).toBe(true);
    expect(validateDomain("my-site.io").valid).toBe(true);
    expect(validateDomain("  EXAMPLE.COM  ").domain).toBe("example.com");
  });

  it("rejects invalid formats", () => {
    expect(validateDomain("").valid).toBe(false);
    expect(validateDomain("not a domain").valid).toBe(false);
    expect(validateDomain("example").valid).toBe(false);
    expect(validateDomain("-bad.com").valid).toBe(false);
    expect(validateDomain("bad-.com").valid).toBe(false);
  });

  it("rejects IP addresses", () => {
    expect(validateDomain("192.168.1.1").valid).toBe(false);
    expect(validateDomain("8.8.8.8").valid).toBe(false);
    expect(validateDomain("::1").valid).toBe(false);
  });

  it("rejects blocked TLDs", () => {
    expect(validateDomain("foo.local").valid).toBe(false);
    expect(validateDomain("foo.internal").valid).toBe(false);
    expect(validateDomain("foo.invalid").valid).toBe(false);
  });

  it("rejects overly long domains", () => {
    const long = "a".repeat(64) + ".com";
    expect(validateDomain(long).valid).toBe(false);
  });
});

describe("isPrivateIp", () => {
  it("detects private IPv4", () => {
    expect(isPrivateIp("10.0.0.1")).toBe(true);
    expect(isPrivateIp("192.168.1.1")).toBe(true);
    expect(isPrivateIp("172.16.0.1")).toBe(true);
    expect(isPrivateIp("172.31.255.255")).toBe(true);
    expect(isPrivateIp("127.0.0.1")).toBe(true);
    expect(isPrivateIp("169.254.169.254")).toBe(true);
  });

  it("allows public IPv4", () => {
    expect(isPrivateIp("8.8.8.8")).toBe(false);
    expect(isPrivateIp("1.1.1.1")).toBe(false);
    expect(isPrivateIp("172.32.0.1")).toBe(false);
  });

  it("detects private IPv6", () => {
    expect(isPrivateIp("::1")).toBe(true);
    expect(isPrivateIp("fe80::1")).toBe(true);
    expect(isPrivateIp("fc00::1")).toBe(true);
  });
});