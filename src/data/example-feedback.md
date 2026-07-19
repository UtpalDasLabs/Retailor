# Example LLM tailoring feedback

This is what a reply from any LLM looks like when it follows the Retailor
Prompt Pack. The assessment text above the block is free-form; Retailor only
reads the **last** `cv-edits` fenced block.

Your CV is strong on consumer wellness apps, but for a *Director of Product —
Subscription Growth* role I would sharpen the label, lead with subscription
outcomes, and put the growth skill first.

```cv-edits
{
  "version": 1,
  "targetRole": "Director of Product — Subscription Growth",
  "rationale": "Lead with subscription growth and pricing outcomes for a growth-focused role.",
  "edits": [
    {
      "op": "set",
      "path": "/basics/label",
      "value": "Director of Product — Subscription Growth",
      "why": "Mirror the target role title so recruiters match instantly."
    },
    {
      "op": "set",
      "path": "/basics/summary/0",
      "value": "Subscription growth leader with 12+ years scaling consumer wellness and fitness apps used by millions across Europe and North America.",
      "why": "Open with the subscription-growth angle instead of the generic product angle."
    },
    {
      "op": "replace",
      "path": "/work/1/highlights/1",
      "value": "Shipped a personalization engine that lifted 30-day retention by 18 points, directly increasing subscriber lifetime value.",
      "why": "Tie the retention win to subscriber lifetime value, the metric this role owns."
    },
    {
      "op": "insert",
      "path": "/basics/x_highlights/0",
      "value": "Grew paid subscriptions by 40% through pricing experiments and onboarding redesign across two consumer apps.",
      "why": "Put the most role-relevant proof point first."
    },
    {
      "op": "remove",
      "path": "/x_portfolio/9",
      "why": "The lifecycle messaging tool is internal plumbing and costs sidebar space for a growth role."
    },
    {
      "op": "move",
      "from": "/x_coreCompetence/1",
      "path": "/x_coreCompetence/0",
      "why": "Subscription Growth & Pricing should top the competence list for this role."
    }
  ]
}
```
