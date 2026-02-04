# GitHub'a Yükleme Rehberi

Proje Git ile hazır; ilk commit atıldı. Aşağıdaki adımlarla kodu GitHub’a yükleyebilirsiniz.

---

## 1. GitHub’da yeni depo oluşturma

1. **https://github.com** adresine gidin ve giriş yapın.
2. Sağ üstten **“+”** → **“New repository”** seçin.
3. **Repository name:** Örn. `mobile-currency-exchange` veya `networkproject`.
4. **Description:** (İsteğe bağlı) Örn. "Mobile Currency Exchange System - NBP API".
5. **Public** seçin.
6. **“Add a README file”**, **“.gitignore”** veya **“License”** eklemeyin (projede zaten var).
7. **“Create repository”** ile oluşturun.

---

## 2. Projeyi GitHub’a bağlama ve gönderme

Terminalde proje klasöründe şu komutları çalıştırın.  
`YOUR_USERNAME` ve `REPO_NAME` kısımlarını kendi GitHub kullanıcı adınız ve oluşturduğunuz repo adıyla değiştirin.

```bash
cd /Users/elifezgiemre/Desktop/networkproject

# GitHub repo adresinizi ekleyin (HTTPS örnek)
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# Ana dalı gönderin
git push -u origin main
```

**Örnek:** Kullanıcı adınız `elifezgiemre`, repo adı `mobile-currency-exchange` ise:

```bash
git remote add origin https://github.com/elifezgiemre/mobile-currency-exchange.git
git push -u origin main
```

---

## 3. İlk push’ta kimlik doğrulama

- **HTTPS** kullanıyorsanız: GitHub kullanıcı adı ve **Personal Access Token (PAT)** istenir.  
  Şifre yerine token kullanın: GitHub → **Settings** → **Developer settings** → **Personal access tokens** → token oluşturup burada girin.
- **SSH** kullanmak isterseniz:
  ```bash
  git remote set-url origin git@github.com:YOUR_USERNAME/REPO_NAME.git
  git push -u origin main
  ```
  SSH anahtarınızı GitHub hesabınıza eklemeniz gerekir.

---

## 4. Sonraki güncellemeler

Kodda değişiklik yaptıktan sonra:

```bash
git add .
git commit -m "Kısa açıklama"
git push
```

---

## Özet

| Adım | Komut / İşlem |
|------|----------------|
| 1 | GitHub’da yeni repo oluştur (README/.gitignore ekleme) |
| 2 | `git remote add origin https://github.com/USER/REPO.git` |
| 3 | `git push -u origin main` |
| 4 | Gerekirse GitHub kullanıcı adı + Personal Access Token ile giriş yap |

Bu adımlardan sonra kaynak kodunuz GitHub’da “Source code available in a Git repository (GitHub)” ifadesiyle belirtebileceğiniz şekilde yayında olur.
