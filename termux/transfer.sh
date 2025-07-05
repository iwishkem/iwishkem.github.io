#!/data/data/com.termux/files/usr/bin/bash

echo "📁 Python dosyası nerde? (örnek: ~/storage/shared/scriptim.py)"
read -p "➡️  Dosya yolu: " file_path

# Dosya kontrolü
if [ ! -f "$file_path" ]; then
    echo "❌ Dosya bulunamadı: $file_path"
    exit 1
fi

arch_path="/data/data/com.termux/files/usr/var/lib/proot-distro/installed-rootfs/archlinux/root"
if [ ! -d "$arch_path" ]; then
    echo "❌ Arch Linux root dizini bulunamadı!"
    exit 1
fi

file_name=$(basename "$file_path")
echo "📦 $file_name dosyası Arch ortamına aktarılıyor..."
cp "$file_path" "$arch_path"

if [ $? -eq 0 ]; then
    echo "✅ Başarıyla kopyalandı!"
    echo "📍 Arch ortamında çalıştırmak için:"
    echo "proot-distro login archlinux"
    echo "python3.9 /root/$file_name"
else
    echo "❌ Kopyalama sırasında hata oluştu."
fi
