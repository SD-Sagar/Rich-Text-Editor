const formatdoc = (cmd,value=false)=>{
    if(value){
        document.execCommand(cmd,false,value);
    }else{
        document.execCommand(cmd);
    }
};

const handleLink = () =>{
    const url = prompt("Enter the link URL:");
    formatdoc('createLink',url);
}

const content = document.getElementById('content');

content.addEventListener('mouseenter',()=>{
    let anchors = content.querySelectorAll('a');
    anchors.forEach(anchor=>{
        anchor.addEventListener('mouseenter',()=>{
            anchor.setAttribute('target','_blank');
            content.setAttribute('contenteditable',false);
        })
        anchor.addEventListener('mouseleave',()=>{
            content.setAttribute('contenteditable',true);
        })
    })
})


let fileName=document.getElementById('filename');
function handeFileExport(value){
      if(value==='new'){
        content.innerHTML='';
        fileName.value='File Name';
      }
      if(value==='pdf'){
        html2pdf(content).save(fileName.value);
      }
      if(value==='txt'){
        const extractedText=content.innerText;
        const blob = new Blob([extractedText]);
        const url = URL.createObjectURL(blob);
        const a =document.createElement('a');
        a.href = url;
        a.download = fileName.value+'.txt';
        a.click();
      }
}

let active = false;
let showcode = document.getElementById('showcode');
showcode.addEventListener('click',()=>{
    active = !active;
    showcode.dataset.active = active;
    if(active){
        content.innerText=content.innerHTML;
        content.setAttribute('contenteditable','false');
    }else{
        content.innerHTML=content.innerText;
        content.setAttribute('contenteditable','true');  
    }
})