#!/usr/bin/env bash
set -euo pipefail

python3 -m pip install --user --upgrade huggingface_hub
huggingface-cli download Qwen/Qwen3-4B \
  --local-dir "${1:-models/Qwen3-4B}" \
  --local-dir-use-symlinks False

echo "Qwen3-4B indirildi. Sunucuyu ASLAN_LLM_URL ile bu klasöre bağlayabilirsiniz."
