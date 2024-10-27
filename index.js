"use strict"
const pulumi = require("@pulumi/pulumi");
const aws = require("@pulumi/aws");

// Create a VPC
const vpc = new aws.ec2.Vpc("my-vpc", {
    cidrBlock: "10.0.0.0/16",
    enableDnsHostnames: true,
    enableDnsSupport: true,
    tags: {
        Name: "my-vpc"
    }
})

// Create an Internet Gateway
const internetGateway = new aws.ec2.InternetGateway("my-igw", {
    vpcId: vpc.id,
    tags: {
        Name: "my-igw"
    }
})

// Create a Public Subnet
const publicSubnet = new aws.ec2.Subnet("public-subnet", {
    vpcId: vpc.id,
    cidrBlock: "10.0.1.0/24",
    availabilityZone: "ap-southeast-1a",
    mapPublicIpOnLaunch: true,
    tags: {
        Name: "public-subnet"
    }
})

// Create a Route Table
const routeTable = new aws.ec2.RouteTable("public-rt", {
    vpcId: vpc.id,
    routes: [
        {
            cidrBlock: "0.0.0.0/0",
            gatewayId: internetGateway.id
        }
    ],
    tags: {
        Name: "public-rt"
    }
})

// Associate the Route Table with Public Subnet
const routeTableAssociation = new aws.ec2.RouteTableAssociation("public-rta", {
    subnetId: publicSubnet.id,
    routeTableId: routeTable.id
})

// Create a security group
const securityGroup = new aws.ec2.SecurityGroup("web-sg", {
    description: "Allow inbount HTTP and SSH traffic",
    vpcId: vpc.id,
    ingress: [
        {
            protocol: "tcp",
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ["0.0.0.0/0"]
        },
        {
            protocol: "tcp",
            fromPort: 22,
            toPort: 22,
            cidrBlocks: ["0.0.0.0/0"]
        }
    ],
    egress: [
        {
            protocol: "-1",
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ["0.0.0.0/0"]
        }
    ],
    tags: {
        Name: "web-sg"
    }
})

// Create Key Pair
const keyPair = new aws.ec2.KeyPair("my-key-pair", {
    publicKey: "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQCh40P2QNGlv/pDC8TFcypKPP7mPxmnLruMv0eHihu7nGjtp6m/o3wtYjhFUNCFXSeaV+VlV1QnhN9+Ho+o7wLmD/zfzTjkbbTCqUfxWLxnBKN0ZLx50SYotlZqJlztlVhwA/AJZ+z+z2ONK9wmvgKdhaltLBlInh9VrJKeswvOFF602FzJg1YaE7U2r/7zGziVXPCTBFWNbspOP5OeiDAYDK3rv0H42lbR8x3CiWvQQvm5NYb0dKQGrB8EsyT4Ae/idm//LgoVu2QV+a6b/ar2jTOn3IuxPixm0WgLqVps8dZIX4lDt/coAgNdkUxUUPyxF0mGjhao9En30QrUIL3l root@d60fe3ebf112aaf8"
})

// Create two EC2 Instances
const createEC2Instance = (name, az) => {
    return new aws.ec2.Instance(name, {
        instanceType: "t3.small",
        ami: "ami-047126e50991d067b",
        subnetId: publicSubnet.id,
        associatePublicIpAddress: true,
        vpcSecurityGroupIds: [securityGroup.id],
        availabilityZone: az,
        keyName: keyPair.keyName,
        tags: {
            Name: name
        }
    })
}

const instance1 = createEC2Instance("instance-1", "ap-southeast-1a");
const instance2 = createEC2Instance("instance-2", "ap-southeast-1a");

exports.vpcId = vpc.id 
exports.instance1PublicIp = instance1.publicIp
exports.instance2PublicIp = instance2.publicIp