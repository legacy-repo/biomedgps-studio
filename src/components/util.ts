import * as webllm from "@mlc-ai/web-llm";

export const initChat = async () => {
    // const chat = new webllm.ChatWorkerClient(new Worker(
    //   new URL('./assets/web-llm.worker.js', import.meta.url),
    //   { type: 'module' }
    // ));
    const chat = new webllm.ChatModule();

    const myAppConfig = {
        model_list: [
            {
                "model_url": "https://huggingface.co/mlc-ai/Mistral-7B-Instruct-v0.2-q4f16_1-MLC/resolve/main/",
                "local_id": "Mistral-7B-Instruct-v0.2-q4f16_1",
                "model_lib_url": "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/Mistral-7B-Instruct-v0.2/Mistral-7B-Instruct-v0.2-q4f16_1-sw4k_cs1k-webgpu.wasm",
                "required_features": ["shader-f16"],
            },
            // Add your own models here...
        ]
    }

    console.log("Chat AI is loading...");
    await chat.reload("Mistral-7B-Instruct-v0.2-q4f16_1", undefined, myAppConfig);
    console.log("Chat AI is loaded.");

    window.chat = chat;

    return chat;
};
