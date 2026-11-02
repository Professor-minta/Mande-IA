# Entraîner Mande-IA v5

Mande-IA v3 est construit sur **Llama 3.2 3B Instruct** de Meta. Ce dossier l'entraîne sur une carte graphique gratuite de Google Colab, puis le ramène dans Ollama sur le Lenovo.

[Ouvrir le cahier dans Google Colab](https://colab.research.google.com/github/Professor-minta/Mande-IA/blob/main/entrainement/mande-ia-v5.ipynb)

| Fichier | Rôle |
|---|---|
| `mande-ia-v5.ipynb` | Le cahier Colab : données, entraînement, examen, export |
| `donnees/identite.jsonl` | Qui est Mande-IA : une question et sa réponse par ligne |
| `donnees/examen.jsonl` | Les questions de l'examen. Elles ne vont jamais dans l'entraînement |

## 1. Ajouter les contributions de Data-Collections (facultatif)

Dans le terminal d'aaPanel :

```bash
cd /www/wwwroot/data.mintaservices.com
curl -s -H "x-admin-token: $(grep '^ADMIN_TOKEN=' .env | cut -d= -f2- | tr -d '"')" http://127.0.0.1:3003/api/admin/export.csv -o /root/data-collections-validees.csv
wc -l /root/data-collections-validees.csv
```

Dans aaPanel, **Files → /root**, télécharge `data-collections-validees.csv`, puis dépose-le dans Google Drive, dossier **Mande-IA-entrainement**. Le cahier le trouve tout seul. Seules les phrases validées par la communauté sont exportées, sans les noms des contributeurs.

## 2. Entraîner sur Colab (environ 40 minutes)

1. Ouvre le lien du cahier ci-dessus, connecté avec ton compte Google.
2. Vérifie **Exécution → Modifier le type d'exécution → T4 GPU**.
3. **Exécution → Tout exécuter**, puis accepte l'accès à Google Drive.
4. Laisse l'onglet ouvert jusqu'au message « Terminé ».

Si Colab refuse la carte graphique, le quota gratuit du jour est épuisé : réessaie plus tard.

## 3. Ramener v5 sur le Lenovo

1. Google Drive → **Mande-IA-entrainement → llama-mande-ia-v5**.
2. Télécharge `adaptateur.zip`, `Modelfile` et `examen.txt` dans `C:\MandeIA\v5`.
3. Clic droit sur `adaptateur.zip` → **Extraire tout** → **Extraire**.
4. Dans PowerShell :

```powershell
cd C:\MandeIA\v5
ollama create professor-minta/llama-mande-ia.v5 -f Modelfile
ollama run professor-minta/llama-mande-ia.v5
```

L'adaptateur pèse moins de 100 Mo et s'appuie sur v3, déjà installé. Si v5 répond de façon étrange, télécharge plutôt `llama-mande-ia-v5-Q4_K_M.gguf` (2 Go) et `Modelfile-complet`, puis :

```powershell
ollama create professor-minta/llama-mande-ia.v5 -f Modelfile-complet
```

## 4. L'examen, puis la publication

1. Pose les questions de `examen.txt` à v3, puis à v5. Note chaque réponse : 2 juste, 1 à moitié, 0 faux. Pour le bambara, fais noter par un locuteur.
2. Publie seulement si v5 a une meilleure note : `ollama push professor-minta/llama-mande-ia.v5`.

La licence Llama 3.2 demande que le nom d'un modèle entraîné commence par « Llama » et que la mention « Built with Llama » soit visible, par exemple sur la page À propos de Mande-IA.

## Modifier les données

- **Identité** : ajoute une ligne dans `donnees/identite.jsonl`, au format `{"question": "...", "reponse": "..."}`. Pas de prix ni de numéro de téléphone : ils changent, et le modèle les déformerait.
- **Examen** : ajoute des questions dans `donnees/examen.jsonl` jusqu'à 30 au moins. Le champ `bloquer` retire de l'entraînement toute phrase qui contient ces mots.
- **Phrases à vérifier** : le réglage `A_VERIFIER` du cahier écarte deux phrases de `bambara-demo.js`. Corrige-les dans `bambara-demo.js` si besoin, puis retire-les de la liste.

## Sources

- [Bayelemabaga](https://huggingface.co/datasets/RobotsMaliAI/bayelemabaga), RobotsMali, licence CC BY-SA 4.0. Seules les lignes en orthographe moderne (ɛ, ɔ, ɲ, ŋ) sont gardées.
- [OpenAssistant oasst2](https://huggingface.co/datasets/OpenAssistant/oasst2), licence Apache 2.0, pour garder un bon français général.
- [Llama 3.2](https://huggingface.co/unsloth/Llama-3.2-3B-Instruct), licence Llama 3.2 Community License.
- [Unsloth](https://github.com/unslothai/unsloth) pour l'entraînement LoRA.
