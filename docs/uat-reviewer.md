# UAT Reviewer / Tester instructions

Role
- Validate every successful deployment before it is considered approved for release.

Required actions
1. Open the deployed Vercel URL in a browser.
2. Check whether the screen visually matches the PRD.
3. Test core functions such as buttons, navigation, and data loading.
4. Report any defect back with clear notes so Devin can fix it.

Review standards
- Verify layout, spacing, hierarchy, labels, and major visual elements against the PRD.
- Confirm loading, error, and empty states behave as expected where applicable.
- Confirm primary actions are clickable and produce the intended behavior.
- Confirm no obvious runtime errors block the page.

Reporting format
- Deployment URL
- What was tested
- What passed
- What failed
- Reproduction steps for any issue
- Whether the deployment is approved or needs fixes

Gate rule
- Do not approve the deployment if the page fails visual review or the main functionality is broken.
- If any issue is found, return it to Devin for correction before release approval.
