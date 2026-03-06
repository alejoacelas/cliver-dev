import type { CheckDeclaration } from "@cliver/contracts";

/**
 * Determines which checks are eligible to run given current pipeline state.
 *
 * A check is eligible when:
 * 1. All its required fields have been completed.
 * 2. If it needs consent, consent has been granted.
 * 3. It is not already running or completed.
 */
export class CheckDependencyResolver {
  /**
   * @param declarations - All check declarations in the pipeline.
   * @param completedFields - Field IDs the customer has filled in.
   * @param consentedChecks - Check IDs for which consent has been granted.
   * @param runningOrCompleted - Check IDs already running or finished (prevents double-runs).
   * @returns Array of check IDs that are now eligible to execute.
   */
  resolveEligible(
    declarations: CheckDeclaration[],
    completedFields: string[],
    consentedChecks: Set<string>,
    runningOrCompleted: Set<string>,
  ): string[] {
    const completedSet = new Set(completedFields);

    return declarations
      .filter((decl) => {
        // Skip if already running or completed
        if (runningOrCompleted.has(decl.id)) return false;

        // All required fields must be completed
        const fieldsMet = decl.requiredFields.every((f) => completedSet.has(f));
        if (!fieldsMet) return false;

        // If consent is needed, it must have been granted
        if (decl.needsConsent && !consentedChecks.has(decl.id)) return false;

        return true;
      })
      .map((decl) => decl.id);
  }
}
