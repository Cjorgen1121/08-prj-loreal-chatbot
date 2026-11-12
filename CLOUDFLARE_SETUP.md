# Connect this project to Cloudflare

Your OpenAI API key belongs in Cloudflare's encrypted secret settings, never in GitHub or browser code.

## Recommended: one Cloudflare Pages project

1. In Cloudflare, open **Workers & Pages** and create a **Pages** project using the GitHub repository **Cjorgen1121/08-prj-loreal-chatbot**, branch **main**.
2. Choose **None** for the framework. Set **Build command** to **npm run build** and **Build output directory** to **dist**. The included build script copies only the public website files into dist.
3. In the Pages project, open **Settings > Variables and Secrets > Add**. Create a secret named **OPENAI_API_KEY**, enter the key in Cloudflare, select **Encrypt**, and save it. Do this for Production, and for Preview too if you want preview deployments to answer questions. Redeploy after adding the secret.
4. Pages automatically deploys functions/api/chat.js at **/api/chat**. The website already sends its requests there, so no URL needs to be pasted into the code. The Function uses the shared Cloudflare Worker handler in RESOURCE_cloudflare-worker.js.
5. Open the Pages URL and test a L’Oréal question, a follow-up, and an unrelated question. Check the layout on a narrow screen and in a private browser window.

The Worker handler reads OPENAI_API_KEY from Cloudflare, adds the L’Oréal-only system prompt, calls OpenAI, and returns the response. The browser displays the reply from data.choices[0].message.content. The default model is gpt-4o; an optional plain Cloudflare variable named OPENAI_MODEL can change it.

## If your class requires a separate Worker URL

You can instead create a standalone Cloudflare Worker by copying RESOURCE_cloudflare-worker.js into the Worker editor. Add OPENAI_API_KEY as a Worker secret and deploy. Then replace the WORKER_URL value near the top of script.js with the full deployed Worker URL. The Pages Function is the simpler option when your Cloudflare account is connected to this repository.

The basic local Codespaces preview shows the website but cannot run the Pages Function. Live AI replies start after the Cloudflare deployment and secret are in place.

Official guides: https://developers.cloudflare.com/pages/framework-guides/deploy-anything/ and https://developers.cloudflare.com/pages/functions/bindings/.
