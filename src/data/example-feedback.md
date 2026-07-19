# Example LLM tailoring feedback

This is what a reply from any LLM looks like when it follows the Retailor
Prompt Pack. The assessment text above the block is free-form; Retailor only
reads the **last** `cv-edits` fenced block.

Your CV is strong on platform and AI work, but for a *VP Product — Consumer
Marketplaces* role I would sharpen the label, lead with marketplace outcomes,
and trim industrial-era portfolio items.

```cv-edits
{
  "version": 1,
  "targetRole": "VP Product — Consumer Marketplaces",
  "rationale": "Lead with marketplace growth and monetization; de-emphasize industrial tooling.",
  "edits": [
    {
      "op": "set",
      "path": "/basics/label",
      "value": "VP Product — Consumer Marketplaces",
      "why": "Mirror the target role title so recruiters match instantly."
    },
    {
      "op": "set",
      "path": "/basics/summary/0",
      "value": "Marketplace product leader with 15+ years of experience scaling consumer and AI-enabled platforms across mobility, industrial technology, and SaaS.",
      "why": "Open with the marketplace angle instead of the generic product angle."
    },
    {
      "op": "replace",
      "path": "/work/1/highlights/1",
      "value": "Grew organic acquisition by 25% across 5 markets and doubled engagement, directly lifting marketplace liquidity.",
      "why": "Tie the growth metrics to marketplace liquidity, the KPI this role owns."
    },
    {
      "op": "insert",
      "path": "/basics/x_highlights/0",
      "value": "Scaled two consumer marketplaces through growth, monetization, and liquidity programs across 5+ European markets.",
      "why": "Put the most role-relevant proof point first."
    },
    {
      "op": "remove",
      "path": "/x_portfolio/11",
      "why": "CAD tooling is irrelevant for a consumer marketplace role and costs sidebar space."
    },
    {
      "op": "move",
      "from": "/x_coreCompetence/1",
      "path": "/x_coreCompetence/0",
      "why": "Marketplace Growth & Monetization should top the competence list for this role."
    }
  ]
}
```
