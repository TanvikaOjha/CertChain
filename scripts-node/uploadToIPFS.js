require("dotenv").config({ path: "../.env" }); // reads root .env
const pinataSDK = require("@pinata/sdk");
const fs        = require("fs");

const pinata = new pinataSDK(
  process.env.PINATA_API_KEY,
  process.env.PINATA_SECRET_KEY
);

async function upload(data) {
  // 1. Upload PDF
  const pdfResult = await pinata.pinFileToIPFS(
    fs.createReadStream(data.pdfPath),
    { pinataMetadata: { name: `cert-${data.name}.pdf` } }
  );

  // 2. Upload metadata JSON
  const meta = {
    name: `${data.name} — ${data.degree}`,
    description: `Issued by ${data.institution}`,
    image: `ipfs://${pdfResult.IpfsHash}`,
    attributes: [
      { trait_type: "Course",      value: data.course },
      { trait_type: "Year",        value: data.year },
      { trait_type: "GPA",         value: data.gpa },
      { trait_type: "Institution", value: data.institution }
    ]
  };
  const metaResult = await pinata.pinJSONToIPFS(meta);

  console.log("✓ Done! Copy this CID into your deploy script:");
  console.log(metaResult.IpfsHash);
  return metaResult.IpfsHash;
}

upload({
  name:        "Rahul Kumar",
  degree:      "B.Tech CSE",
  course:      "Blockchain Development",
  institution: "Your College Name",
  year:        "2026",
  gpa:         "8.9",
  pdfPath:     "./assets/sample-cert.pdf"
}).catch(console.error);