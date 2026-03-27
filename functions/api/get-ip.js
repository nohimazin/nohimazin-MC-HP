// OPTIONSリクエスト（ブラウザの事前確認）への対応
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    }
  });
}

// メインのPOSTリクエスト処理
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const formData = await request.formData();
    const token = formData.get("token");

    // ⚠️Cloudflareの環境変数から安全にキーとアドレスを読み込む
    const SECRET_KEY = env.TURNSTILE_SECRET_KEY;
    const SERVER_ADDRESS = env.SERVER_ADDRESS;

    if (!SECRET_KEY || !SERVER_ADDRESS) {
      return new Response(JSON.stringify({ success: false, message: "サーバーの設定が完了していません。" }), { status: 500 });
    }

    // Cloudflareに「人間ですか？」と問い合わせる
    const verifyFormData = new FormData();
    verifyFormData.append("secret", SECRET_KEY);
    verifyFormData.append("response", token);

    const verifyResponse = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: verifyFormData,
    });
    
    const outcome = await verifyResponse.json();

    let result = {};
    if (outcome.success) {
      result = { success: true, address: SERVER_ADDRESS };
    } else {
      result = { success: false, message: "Botとして判定されました。" };
    }

    return new Response(JSON.stringify(result), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
    });

  } catch (error) {
    return new Response(JSON.stringify({ success: false, message: "通信エラーが発生しました。" }), { status: 500 });
  }
}
