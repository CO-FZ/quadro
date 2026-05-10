#!/usr/bin/env bash
# ============================================================
# Smoke anti-spoofing — Story 07B.3 (CA-07/CA-08).
#
# Validação manual em ambientes que não rodam a suíte CI (staging,
# prod read-only) de que um efetivo autenticado NÃO consegue:
#   1. Criar task com `created_by` apontando para outro usuário (admin).
#   2. Inserir em `task_assignees` em nome de outro usuário.
#   3. Atualizar uma task que não lhe pertence (sem ser assignee).
#
# Esta é ferramenta humana — não roda no CI. A suíte automatizada
# equivalente vive na Camada 2 (Story 07A.2 CA-11/CA-12) e na Camada 4
# (pgTAP, Story 07A.4).
#
# Uso:
#   SUPABASE_URL=https://xxx.supabase.co \
#   SUPABASE_ANON_KEY=eyJhbGc... \
#   EFETIVO_JWT=eyJhbGc... \
#   ADMIN_USER_ID=00000000-... \
#   TASK_ID=11111111-... \
#       bash tests/smoke/anti-spoofing.sh
#
# Saída:
#   - PASS quando o backend bloqueou a tentativa (RLS/erro/0 rows).
#   - FAIL quando a tentativa passou — investigar imediatamente.
#   - Código de saída 0 se todos PASS, 1 caso contrário.
# ============================================================

set -u

require() {
    if [[ -z "${!1:-}" ]]; then
        echo "ERRO: variável de ambiente \$$1 obrigatória." >&2
        exit 2
    fi
}

require SUPABASE_URL
require SUPABASE_ANON_KEY
require EFETIVO_JWT
require ADMIN_USER_ID
require TASK_ID

REST="${SUPABASE_URL%/}/rest/v1"
PASS_COUNT=0
FAIL_COUNT=0

# Detecta resposta como bloqueio: RLS, 401/403, ou array vazio (UPDATE sem match).
# Critério: status >= 400 OU corpo contém "row-level security" / "permission denied" /
# "policy" / "violates" / corpo é "[]".
is_blocked() {
    local status="$1"
    local body="$2"
    if (( status >= 400 )); then return 0; fi
    if [[ "$body" =~ row-level\ security|permission\ denied|violates|policy ]]; then return 0; fi
    if [[ "$body" == "[]" ]]; then return 0; fi
    return 1
}

run_case() {
    local label="$1"
    local status="$2"
    local body="$3"
    if is_blocked "$status" "$body"; then
        echo "PASS  $label  [status=$status]"
        PASS_COUNT=$((PASS_COUNT+1))
    else
        echo "FAIL  $label  [status=$status, body=$body]"
        FAIL_COUNT=$((FAIL_COUNT+1))
    fi
}

echo "=== Smoke anti-spoofing — alvo: $SUPABASE_URL ==="
echo

# ── Cenário 1: INSERT em tasks com created_by = admin (spoofing) ──
echo "[1/3] INSERT tasks com created_by = ADMIN_USER_ID (esperado: bloqueio)"
RESP_FILE=$(mktemp)
HTTP=$(curl -sS -o "$RESP_FILE" -w "%{http_code}" \
    -X POST "$REST/tasks" \
    -H "apikey: $SUPABASE_ANON_KEY" \
    -H "Authorization: Bearer $EFETIVO_JWT" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=representation" \
    --data "$(cat <<EOF
{
  "title": "smoke-anti-spoof-$(date +%s)",
  "start_date": "$(date -u +%Y-%m-%d)",
  "end_date": "$(date -u +%Y-%m-%d)",
  "sector": "DT",
  "status": "backlog",
  "created_by": "$ADMIN_USER_ID"
}
EOF
)" || echo "000")
BODY=$(cat "$RESP_FILE")
rm -f "$RESP_FILE"
run_case "INSERT tasks spoofando created_by" "$HTTP" "$BODY"
echo

# ── Cenário 2: INSERT em task_assignees com user_id = admin (spoofing) ──
echo "[2/3] INSERT task_assignees com user_id = ADMIN_USER_ID (esperado: bloqueio)"
RESP_FILE=$(mktemp)
HTTP=$(curl -sS -o "$RESP_FILE" -w "%{http_code}" \
    -X POST "$REST/task_assignees" \
    -H "apikey: $SUPABASE_ANON_KEY" \
    -H "Authorization: Bearer $EFETIVO_JWT" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=representation" \
    --data "{\"task_id\":\"$TASK_ID\",\"user_id\":\"$ADMIN_USER_ID\"}" || echo "000")
BODY=$(cat "$RESP_FILE")
rm -f "$RESP_FILE"
run_case "INSERT task_assignees spoofando user_id" "$HTTP" "$BODY"
echo

# ── Cenário 3: UPDATE em tasks sem ser assignee ──
echo "[3/3] UPDATE tasks sem ser assignee (esperado: 0 rows / bloqueio)"
RESP_FILE=$(mktemp)
HTTP=$(curl -sS -o "$RESP_FILE" -w "%{http_code}" \
    -X PATCH "$REST/tasks?id=eq.$TASK_ID" \
    -H "apikey: $SUPABASE_ANON_KEY" \
    -H "Authorization: Bearer $EFETIVO_JWT" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=representation" \
    --data '{"title":"smoke-anti-spoof-rewrite"}' || echo "000")
BODY=$(cat "$RESP_FILE")
rm -f "$RESP_FILE"
run_case "UPDATE tasks fora de assignment" "$HTTP" "$BODY"
echo

echo "=== Resultado: $PASS_COUNT PASS / $FAIL_COUNT FAIL ==="
if (( FAIL_COUNT > 0 )); then
    exit 1
fi
exit 0
