import octokit from '@/instance/octokit';

import REPOSITORY from '@/constant/repository';

export const getMilestone = async (num: number) => {
  try {
    const res = await octokit.issues.getMilestone({
      milestone_number: num,
      repo: REPOSITORY.repository,
      owner: REPOSITORY.owner,
    });

    return res.data;
  } catch (err) {
    console.error(err);

    return undefined;
  }
};
