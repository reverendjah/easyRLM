# Playbook: Infra/Deploy

## Phase: Reproduce

### Steps

1. **Read deploy files BEFORE any investigation**:
   ```
   Read terraform/deploy.sh
   Read terraform/startup-script.sh (or equivalent)
   Read terraform/main.tf (locals and env vars)
   Read terraform/modules/compute-instance/main.tf (lifecycle rules)
   ```

2. **Map lifecycle**:
   - How does the VM start?
   - How do env vars reach the container?
   - What happens on `/deploy`?
   - What happens on `terraform apply`?

3. **Check VM logs**:
   ```bash
   gcloud compute ssh {instance} --command="sudo journalctl -u google-startup-scripts -n 100"
   ```

4. **Check container**:
   ```bash
   gcloud compute ssh {instance} --command="sudo docker logs social-medias --tail 50"
   ```

5. **Evidence**: Log showing startup error or missing env var

---

## Phase: Investigate

### Lifecycle Mapping

#### Flow Diagram

```
BUG LIFECYCLE:
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  terraform      │ --> │  startup script  │ --> │  container      │
│  (defines vars) │     │  (applies vars)  │     │  (uses vars)    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                       │                       │
         v                       v                       v
   When changes?           When executes?          When restarts?
   [answer]                [answer]                [answer]
```

#### Required Questions

1. **Where is the value defined?** (terraform, env, secret, hardcoded)
2. **How does the value reach the destination?** (startup script, SCP, mount, API)
3. **What triggers update?** (apply, deploy, restart, nothing)
4. **Is there cache/ignore blocking?** (ignore_changes, cache, stale)

---

## Phase: Verify

### Deploy Simulation

```bash
# Simulate what /deploy would do (without actually executing)
cd terraform && ./deploy.sh update --dry-run

# OR if no dry-run available, verify manually:
# 1. What changes in startup script?
# 2. What changes in container?
# 3. Are env vars correct?
```

### Permanence Test

Execute ONE of the following (from least to most destructive):

1. **Container restart** (fast, no downtime):
   ```bash
   gcloud compute ssh {instance} --command="sudo docker restart social-medias"
   # Verify bug doesn't return
   ```

2. **VM restart** (1-2 min downtime):
   ```bash
   gcloud compute instances reset {instance} --zone={zone}
   # Wait for startup, verify bug doesn't return
   ```

3. **Full deploy** (if terraform changes):
   ```bash
   ./deploy.sh update
   # Verify bug doesn't return
   ```

### Success Criteria

- [ ] Applied fix persists after chosen restart
- [ ] Logs don't show the original error
- [ ] Affected functionality operates normally

---

## Portability Pitfalls

Scripts may behave differently between macOS and Linux.

### Problematic Patterns (BSD vs GNU)

| GNU | BSD/POSIX | Affects |
|-----|-----------|---------|
| `\s` | `[[:space:]]` | sed, grep |
| `\d` | `[0-9]` | sed, grep |
| `sed -i ''` (macOS) | `sed -i` (Linux) | in-place |

### Portability Checklist

IF bug involves script executed on macOS:
- [ ] Scripts use POSIX character classes?
- [ ] Regex works on both GNU and BSD?

### Diagnostics

```bash
# Test regex
echo "key  = \"value\"" | sed 's/.*=[[:space:]]*"\(.*\)"/\1/'
# If returns entire line: BSD didn't understand \s
```
