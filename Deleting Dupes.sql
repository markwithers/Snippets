select COUNT(*), CaseId, RuleId from Kctc.CompletedCaseRule
where AssociatedPersonId IS NOT NULL
group by CaseId, RuleId
having COUNT(*) > 1

;WITH Duplicates AS
(
   SELECT 
   ROW_NUMBER() 
   OVER(PARTITION BY CaseId, RuleId ORDER BY CaseId) 
	AS RowNumber, CaseId, RuleId,
	CompletedCaseRuleId
   FROM Kctc.CompletedCaseRule
   WHERE AssociatedPersonId IS NOT NULL
) 
SELECT * -- DELETE
FROM Kctc.CompletedCaseRule
WHERE EXISTS(
SELECT * FROM Duplicates
WHERE RowNumber != 1
	AND Duplicates.CompletedCaseRuleId = Kctc.CompletedCaseRule.CompletedCaseRuleId)