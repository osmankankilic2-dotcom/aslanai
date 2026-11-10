# Aslan AI — Qwen3-4B

Aslan AI Plus katmanı Qwen3-4B ile çalışır. Model ağırlıkları yaklaşık 7,6 GB olduğu için GitHub deposuna eklenmez; GitHub tek dosya sınırları ve depo boyutu nedeniyle model dosyasını burada tutmak uygun değildir.

## Hugging Face’ten indirme

```bash
python -m pip install -U huggingface_hub
huggingface-cli download Qwen/Qwen3-4B \
  --local-dir ./models/Qwen3-4B \
  --local-dir-use-symlinks False
```

Model sayfası: https://huggingface.co/Qwen/Qwen3-4B

## Windows 10

PowerShell’de:

```powershell
py -m pip install -U huggingface_hub
huggingface-cli download Qwen/Qwen3-4B `
  --local-dir .\models\Qwen3-4B `
  --local-dir-use-symlinks False
```

İndirme tamamlandıktan sonra yerel OpenAI-uyumlu sunucu, uygulamanın `ASLAN_LLM_URL` değişkeniyle bağlanabilir. Ağırlık dosyalarını Git’e veya herkese açık bir depoya yüklemeyin; bu depo yalnızca kod, kurulum ve çalıştırma belgelerini içerir.
