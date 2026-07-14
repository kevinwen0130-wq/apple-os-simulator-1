window.cameraData = {
  title: "相機",
  icon: "📷",
  buttonText: "拍照"
};

window.takePhoto = function () {
  if (!window.photosData) return;

  // 新增一張照片到最前面
  window.photosData.images.unshift("📸");

  showNotice("照片已儲存到「照片」。");
};

console.log("camera.js 載入成功！");