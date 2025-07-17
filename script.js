const { createFFmpeg, fetchFile } = FFmpeg;
let ffmpeg;

// HTML要素を取得
const uploader = document.getElementById('uploader');
const trimButton = document.getElementById('trim-button');
const message = document.getElementById('message');
const progressDiv = document.getElementById('progress');
const downloadLink = document.getElementById('download-link');

// FFmpegのインスタンスを生成する関数
const loadFFmpeg = async () => {
    message.textContent = '動画処理エンジンを読み込んでいます...';
    ffmpeg = createFFmpeg({
        log: true, // 処理ログをコンソールに出力
        progress: ({ ratio }) => {
            // 進捗を表示
            progressDiv.textContent = `処理中... ${Math.round(ratio * 100)}%`;
        },
    });
    await ffmpeg.load();
    message.textContent = '準備完了です。動画ファイルを選択してください。';
    trimButton.disabled = false;
};

// 切り出し処理を行う関数
const trimVideo = async () => {
    const files = uploader.files;
    if (files.length === 0) {
        alert('動画ファイルを選択してください。');
        return;
    }

    // UIをリセット・更新
    message.textContent = '動画ファイルの読み込みを開始します...';
    trimButton.disabled = true;
    downloadLink.innerHTML = '';
    progressDiv.textContent = '';

    const file = files[0];
    const startTime = document.getElementById('start-time').value;
    const endTime = document.getElementById('end-time').value;
    const inputFileName = 'input.mp4'; // FFmpeg内で使うファイル名
    const outputFileName = `output_${Date.now()}.mp4`; // 出力ファイル名

    try {
        // 1. FFmpegにファイルを渡す
        ffmpeg.FS('writeFile', inputFileName, await fetchFile(file));
        message.textContent = '動画の切り出し処理を実行します...';

        // 2. FFmpegコマンドを実行
        // -i: 入力ファイル
        // -ss: 開始時間
        // -to: 終了時間
        // -c copy: 再エンコードせず、元動画の品質のまま高速にコピーする
        await ffmpeg.run('-i', inputFileName, '-ss', startTime, '-to', endTime, '-c', 'copy', outputFileName);

        // 3. 処理後のファイルを読み込む
        const data = ffmpeg.FS('readFile', outputFileName);

        // 4. ダウンロードリンクを生成
        const videoBlob = new Blob([data.buffer], { type: 'video/mp4' });
        const url = URL.createObjectURL(videoBlob);
        downloadLink.href = url;
        downloadLink.download = outputFileName;
        downloadLink.textContent = `✅ 処理完了！ここをクリックして「${outputFileName}」をダウンロード`;

        message.textContent = '切り出しに成功しました！';

    } catch (error) {
        console.error(error);
        message.textContent = `エラーが発生しました: ${error.message}`;
    } finally {
        // ボタンを再度有効化
        trimButton.disabled = false;
    }
};

// イベントリスナーを設定
trimButton.addEventListener('click', trimVideo);

// 初期化処理
trimButton.disabled = true; // FFmpeg読み込み完了までボタンを無効化
loadFFmpeg();
