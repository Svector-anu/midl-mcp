# MIDL Skills for Claude Desktop

Two professional Skills for deploying and verifying smart contracts on MIDL (Bitcoin-anchored EVM).

## Available Skills

### 1. Contract Verification
**File:** `contract-verification.zip`

**Description:** Verify smart contracts on Blockscout using the proven method with 100% success rate

**Use when:**
- Verifying deployed contracts
- Troubleshooting "bytecode doesn't match" errors
- Ensuring contracts are publicly verifiable

**Success rate:** 4/4 contracts (100%)

### 2. Contract Deployment
**File:** `contract-deployment.zip`

**Description:** Deploy smart contracts to MIDL staging network using MCP or Hardhat

**Use when:**
- Deploying contracts to MIDL
- Setting up MIDL deployment environment
- Troubleshooting deployment issues

## Installation Instructions

### Step 1: Upload Skills to Claude Desktop

1. Open Claude Desktop
2. Go to **Settings** (gear icon)
3. Click **Capabilities** → **Skills**
4. Click **Upload Skill**
5. Select `contract-verification.zip`
6. Repeat for `contract-deployment.zip`

### Step 2: Enable the Skills

1. In Settings → Capabilities → Skills
2. Toggle **ON** for both:
   - ✅ Contract Verification
   - ✅ Contract Deployment

### Step 3: Verify Skills Are Active

Ask Claude:
```
What skills do you have available for MIDL?
```

Claude should mention both Contract Verification and Contract Deployment skills.

## Using the Skills

### Verification Examples

**Example 1: Verify an existing contract**
```
Verify the contract at 0xde6c29923d7BB9FDbcDfEC54E7e726894B982593 on MIDL staging
```

**Example 2: Get help with verification error**
```
I'm getting "bytecode doesn't match" when verifying my contract.
The address is 0x...
Can you help?
```

### Deployment Examples

**Example 1: Deploy via MCP**
```
Deploy this contract to MIDL staging:

pragma solidity 0.8.24;

contract SimpleStorage {
    uint256 public value;

    function setValue(uint256 _value) public {
        value = _value;
    }
}
```

**Example 2: Setup help**
```
Help me set up Hardhat for MIDL deployment
```

**Example 3: Troubleshoot deployment**
```
My deployment is hanging at "Executing transaction..."
for 10 minutes. Is this normal?
```

## What's Included in Each Skill

### Contract Verification Skill

**Skill.md:**
- Network information (staging)
- Step-by-step verification process
- Bytecode decoding guide
- Common issues and solutions
- Examples of successful verifications
- Quick commands reference

**REFERENCE.md:**
- Complete verification guide
- Troubleshooting section
- Best practices checklist

### Contract Deployment Skill

**Skill.md:**
- MCP vs Hardhat comparison
- Critical configuration requirements
- Performance expectations
- Deployment patterns
- Troubleshooting guide
- Successful deployment examples

**REFERENCE.md:**
- Complete deployment guide
- Network details
- Wallet generation
- Multiple transactions pattern
- Known working deployments

## Skill Metadata

### Contract Verification
```yaml
name: contract-verification
description: Verify smart contracts on Blockscout using the proven method with 100% success rate for MIDL staging network
```

### Contract Deployment
```yaml
name: contract-deployment
description: Deploy smart contracts to MIDL (Bitcoin-anchored EVM) using MCP or Hardhat on staging network
```

**Note:** Skill names must use lowercase letters, numbers, and hyphens only.

## Testing Your Skills

### Test Verification Skill

1. Ask Claude: "Verify contract 0xde6c29923d7BB9FDbcDfEC54E7e726894B982593"
2. Claude should:
   - Load the Contract Verification skill
   - Provide step-by-step guidance
   - Decode compiler version from bytecode
   - Guide you through Hardhat verification

### Test Deployment Skill

1. Ask Claude: "How do I deploy a contract to MIDL?"
2. Claude should:
   - Load the Contract Deployment skill
   - Explain MCP vs Hardhat options
   - Provide configuration requirements
   - Give deployment examples

## Updating Skills

To update a Skill:
1. Make changes to the Skill folder
2. Re-zip the folder
3. Upload the new ZIP file to Claude Desktop
4. Claude will replace the old version

## Troubleshooting

### Skill Not Loading

**Check:**
- Skill is enabled in Settings → Capabilities → Skills
- Claude Desktop was restarted after upload
- ZIP file has correct structure (folder in root, not files directly)

### Claude Not Using Skill

**Try:**
- Be more specific in your prompt
- Mention "MIDL" or "verification" explicitly
- Ask Claude to "use the Contract Verification skill"

### Skill Shows Error

**Fix:**
- Re-download ZIP file
- Check Skill.md has valid YAML frontmatter
- Ensure all referenced files exist

## File Structure

```
skills/
├── contract-verification/
│   ├── Skill.md           # Main skill file with YAML frontmatter
│   └── REFERENCE.md       # Complete verification guide
├── contract-deployment/
│   ├── Skill.md           # Main skill file with YAML frontmatter
│   └── REFERENCE.md       # Complete deployment guide
├── contract-verification.zip  # Ready to upload
├── contract-deployment.zip    # Ready to upload
└── README.md             # This file
```

## Success Metrics

### Verified Contracts (Using These Skills)
- SimpleTest ✅
- MessageBoard ✅
- CollateralERC20 ✅
- RuneERC20 ✅

**Verification Success Rate:** 100% (4/4)

## Resources

- **MIDL Staging:** https://blockscout.staging.midl.xyz
- **Documentation:** See REFERENCE.md in each skill
- **GitHub:** https://github.com/anthropics/skills (for Skill format examples)

## Support

For issues or questions:
1. Check the REFERENCE.md in each skill
2. Review troubleshooting sections
3. Test with the example prompts above

---

**Created:** 2026-02-05
**Skills Version:** 1.0
**Compatibility:** Claude Desktop (Pro, Max, Team, Enterprise plans)
