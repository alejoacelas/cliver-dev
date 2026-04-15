#!/bin/bash
# Run all LLM+Exa test cases and save outputs
set -e

BASE="tool-evaluation/llm-exa-prompts"
OUTDIR="$BASE/test-outputs"
mkdir -p "$OUTDIR"

run_test() {
    local step_prompt="$1"
    local input_file="$2"
    local output_name="$3"

    echo "=== Running $output_name ==="
    uv run tool-evaluation/llm-exa-search.py \
        --system-prompt-file "$BASE/$step_prompt" \
        --prompt-file "$BASE/test-inputs/$input_file" \
        --json -v \
        > "$OUTDIR/$output_name.json" 2> "$OUTDIR/$output_name.stderr"
    echo "  Done. Cost: $(python3 -c "import json; d=json.load(open('$OUTDIR/$output_name.json')); print(f'\${d[\"total_exa_cost_usd\"]:.4f}')")"
}

# Step (a): Address-to-institution
run_test "a-address-institution.txt" "a1-mit.txt" "a1-mit"
run_test "a-address-institution.txt" "a2-genspace.txt" "a2-genspace"
run_test "a-address-institution.txt" "a3-labcentral.txt" "a3-labcentral"
run_test "a-address-institution.txt" "a4-mammoth.txt" "a4-mammoth"

# Step (b): Payment-to-institution
run_test "b-payment-institution.txt" "b1-pfizer.txt" "b1-pfizer"
run_test "b-payment-institution.txt" "b2-helix-fictional.txt" "b2-helix-fictional"
run_test "b-payment-institution.txt" "b3-wire-transfer.txt" "b3-wire-transfer"

# Step (c): Email affiliation
run_test "c-email-affiliation.txt" "c1-aas-africa.txt" "c1-aas-africa"
run_test "c-email-affiliation.txt" "c2-163-china.txt" "c2-163-china"
run_test "c-email-affiliation.txt" "c3-gmail-harvard.txt" "c3-gmail-harvard"
run_test "c-email-affiliation.txt" "c4-pasteur-dual.txt" "c4-pasteur-dual"

# Step (d): Residential detection
run_test "d-residential.txt" "d1-pfizer-commercial.txt" "d1-pfizer-commercial"
run_test "d-residential.txt" "d2-residential.txt" "d2-residential"
run_test "d-residential.txt" "d3-harvard-misclassified.txt" "d3-harvard-misclassified"

# Step (e): PO box / freight forwarder
run_test "e-pobox-freight.txt" "e1-shipito.txt" "e1-shipito"
run_test "e-pobox-freight.txt" "e2-ups-store.txt" "e2-ups-store"
run_test "e-pobox-freight.txt" "e3-university-clean.txt" "e3-university-clean"

echo ""
echo "=== All tests complete ==="
echo "Total cost:"
python3 -c "
import json, glob
total = 0
for f in sorted(glob.glob('$OUTDIR/*.json')):
    d = json.load(open(f))
    cost = d['total_exa_cost_usd']
    total += cost
    name = f.rsplit('/', 1)[1].replace('.json', '')
    iters = d['iterations']
    calls = len(d['tool_calls'])
    print(f'  {name:30s}  {calls} searches  {iters} iters  \${cost:.4f}')
print(f'  {\"TOTAL\":30s}  \${total:.4f}')
"
