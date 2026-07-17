// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Escrow is ReentrancyGuard {

    enum JobStatus {
        Created,
        Active,
        Submitted,
        NotApproved,
        Disputed,
        Paid,
        Refunded
    }

    struct Job {
        uint256 id;
        address payable client;
        address payable freelancer;
        address mediator;
        uint256 amount;
        string title;
        string description;
        string deliverableHash;
        JobStatus status;
        uint256 createdAt;
    }

    uint256 public jobCount;

    mapping(uint256 => Job) public jobs;

    // EVENTS

    event JobCreated(
        uint256 indexed jobId,
        address indexed client,
        address indexed freelancer,
        uint256 amount
    );

    event JobAccepted(uint256 indexed jobId);

    event WorkSubmitted(
        uint256 indexed jobId,
        string deliverableHash
    );

    event WorkRejected(
        uint256 indexed jobId,
        string reason
    );

    event FundsReleased(
        uint256 indexed jobId,
        address freelancer,
        uint256 amount
    );

    event DisputeRaised(
        uint256 indexed jobId,
        address raisedBy
    );

    event DisputeResolved(
        uint256 indexed jobId,
        uint256 freelancerAmount,
        uint256 clientAmount
    );

    // CREATE JOB

    function createJob(
        address payable _freelancer,
        address _mediator,
        string memory _title,
        string memory _description
    ) external payable {

        require(msg.value > 0, "Amount must be greater than 0");
        require(
            _freelancer != address(0),
            "Invalid freelancer address"
        );
        require(
            _mediator != address(0),
            "Invalid mediator address"
        );

        jobCount++;

        jobs[jobCount] = Job({
            id: jobCount,
            client: payable(msg.sender),
            freelancer: _freelancer,
            mediator: _mediator,
            amount: msg.value,
            title: _title,
            description: _description,
            deliverableHash: "",
            status: JobStatus.Created,
            createdAt: block.timestamp
        });

        emit JobCreated(
            jobCount,
            msg.sender,
            _freelancer,
            msg.value
        );
    }

    // ACCEPT JOB

    function acceptJob(uint256 _jobId) external {

        Job storage job = jobs[_jobId];

        require(
            msg.sender == job.freelancer,
            "Only freelancer can accept"
        );

        require(
            job.status == JobStatus.Created,
            "Job not available"
        );

        job.status = JobStatus.Active;

        emit JobAccepted(_jobId);
    }

    // SUBMIT WORK

    function submitWork(
        uint256 _jobId,
        string memory _deliverableHash
    ) external {

        Job storage job = jobs[_jobId];

        require(
            msg.sender == job.freelancer,
            "Only freelancer can submit"
        );

        require(
            job.status == JobStatus.Active ||
            job.status == JobStatus.NotApproved,
            "Invalid job status"
        );

        job.deliverableHash = _deliverableHash;

        job.status = JobStatus.Submitted;

        emit WorkSubmitted(
            _jobId,
            _deliverableHash
        );
    }

    // APPROVE WORK

    function approveWork(
        uint256 _jobId
    ) external nonReentrant {

        Job storage job = jobs[_jobId];

        require(
            msg.sender == job.client,
            "Only client can approve"
        );

        require(
            job.status == JobStatus.Submitted,
            "Work not submitted"
        );

        job.status = JobStatus.Paid;

        uint256 amount = job.amount;

        job.amount = 0;

        (bool success, ) = job.freelancer.call{
            value: amount
        }("");

        require(success, "Payment failed");

        emit FundsReleased(
            _jobId,
            job.freelancer,
            amount
        );
    }

    // REJECT WORK

    function rejectWork(
        uint256 _jobId,
        string memory reason
    ) external {

        Job storage job = jobs[_jobId];

        require(
            msg.sender == job.client,
            "Only client can reject"
        );

        require(
            job.status == JobStatus.Submitted,
            "Invalid job status"
        );

        job.status = JobStatus.NotApproved;

        emit WorkRejected(
            _jobId,
            reason
        );
    }

    // RAISE DISPUTE

    function raiseDispute(
        uint256 _jobId
    ) external {

        Job storage job = jobs[_jobId];

        require(
            msg.sender == job.client ||
            msg.sender == job.freelancer,
            "Unauthorized"
        );

        require(
            job.status == JobStatus.Active ||
            job.status == JobStatus.Submitted ||
            job.status == JobStatus.NotApproved,
            "Cannot dispute"
        );

        job.status = JobStatus.Disputed;

        emit DisputeRaised(
            _jobId,
            msg.sender
        );
    }

    // RESOLVE DISPUTE

    function resolveDispute(
        uint256 _jobId,
        uint256 freelancerPercent,
        uint256 clientPercent
    ) external nonReentrant {

        Job storage job = jobs[_jobId];

        require(
            msg.sender == job.mediator,
            "Only mediator allowed"
        );

        require(
            job.status == JobStatus.Disputed,
            "Job not disputed"
        );

        require(
            freelancerPercent + clientPercent == 100,
            "Total must equal 100"
        );

        uint256 totalAmount = job.amount;

        job.amount = 0;

        uint256 freelancerAmount =
            (totalAmount * freelancerPercent) / 100;

        uint256 clientAmount =
            (totalAmount * clientPercent) / 100;

        if (freelancerAmount > 0) {
            (bool successFreelancer, ) =
                job.freelancer.call{
                    value: freelancerAmount
                }("");

            require(
                successFreelancer,
                "Freelancer payment failed"
            );
        }

        if (clientAmount > 0) {
            (bool successClient, ) =
                job.client.call{
                    value: clientAmount
                }("");

            require(
                successClient,
                "Client refund failed"
            );
        }

        if (freelancerPercent > 0) {
            job.status = JobStatus.Paid;
        } else {
            job.status = JobStatus.Refunded;
        }

        emit DisputeResolved(
            _jobId,
            freelancerAmount,
            clientAmount
        );
    }

    // GET JOB DETAILS

    function getJob(
        uint256 _jobId
    ) external view returns (Job memory) {

        return jobs[_jobId];
    }
}
