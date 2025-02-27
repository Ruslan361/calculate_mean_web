







// function selectFolder() {
//     ipcRenderer.invoke("select-folder").then(files => {
//         thumbnails.innerHTML = "";
//         if (files.length > 0) {
//             thumbnailSliderContainer.style.display = "block";
//         } else {
//             thumbnailSliderContainer.style.display = "none";
//         }
//         files.forEach(({ path, name }) => {
//             const imgElem = document.createElement("img");
//             imgElem.src = path;
//             imgElem.title = name;
//             imgElem.style.width = document.getElementById("thumbnail-size").value + "px";
//             imgElem.onclick = () => loadImage(path);
//             thumbnails.appendChild(imgElem);
//      ;   });
//     });
// }





