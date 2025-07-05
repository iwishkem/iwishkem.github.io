#!/data/data/com.termux/files/usr/bin/bash

echo "[1] Termux paketlerini güncelliyorum..."
pkg update -y && pkg upgrade -y
pkg install -y proot-distro git clang make autoconf automake libtool pkg-config

echo "[2] Arch Linux kurulumu..."
proot-distro install archlinux

echo "[3] Arch Linux root ortamına giriyorum ve Python 3.9 kaynak koddan derleniyor..."

proot-distro login archlinux -- bash -c "
pacman -Syu --noconfirm
pacman -S --noconfirm base-devel git

cd /root
if [ ! -d cpython ]; then
  git clone --branch v3.9.17 https://github.com/python/cpython.git
fi
cd cpython

./configure --prefix=/usr --enable-optimizations --with-ensurepip=install
make -j\$(nproc)
make install

python3.9 --version || python3 --version
"

echo ""
echo "Kurulum tamamlandı. Arch ortamına root olarak girip python3.9'u kullanabilirsin:"
echo "proot-distro login archlinux"
echo "python3.9 --version"
