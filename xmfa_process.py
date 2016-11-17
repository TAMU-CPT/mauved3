from Bio import SeqIO
import tempfile
import argparse


def parse_xmfa(xmfa):
    """Simple XMFA parser until https://github.com/biopython/biopython/pull/544
    """
    current_lcb = []
    current_seq = {}
    for line in xmfa.readlines():
        if line.startswith('#'):
            continue

        if line.strip() == '=':
            if 'id' in current_seq:
                current_lcb.append(current_seq)
                current_seq = {}
            yield current_lcb
            current_lcb = []
        else:
            line = line.strip()
            if line.startswith('>'):
                if 'id' in current_seq:
                    current_lcb.append(current_seq)
                    current_seq = {}
                data = line.strip().split()
                # 0 1           2 3      4 5
                # > 1:5986-6406 + CbK.fa # CbK_gp011
                id, loc = data[1].split(':')
                start, end = loc.split('-')
                current_seq = {
                    'rid': '_'.join(data[1:]),
                    'id': id,
                    'start': int(start),
                    'end': int(end),
                    'strand': 1 if data[2] == '+' else -1,
                    'seq': '',
                    'comment': '',
                }
                if len(data) > 5:
                    current_seq['comment'] = ' '.join(data[5:])
            # else:
                # current_seq['seq'] += line.strip()


def percent_identity(a, b):
    """Calculate % identity, ignoring gaps in the host sequence
    """
    match = 0
    mismatch = 0
    for char_a, char_b in zip(list(a), list(b)):
        if char_a == '-':
            continue
        if char_a == char_b:
            match += 1
        else:
            mismatch += 1

    if match + mismatch == 0:
        return 0.0
    return 100 * float(match) / (match + mismatch)


def id_tn_dict(sequences, tmpfile=False):
    """Figure out sequence IDs
    """
    label_convert = {}
    correct_chrom = None
    if not isinstance(sequences, list):
        sequences = [sequences]

    i = 0
    for sequence_file in sequences:
        for record in SeqIO.parse(sequence_file, 'fasta'):
            if correct_chrom is None:
                correct_chrom = record.id

            i += 1
            key = str(i)
            label_convert[key] = {
                'record_id': record.id,
                'len': len(record.seq),
            }

            if tmpfile:
                label_convert[key] = tempfile.NamedTemporaryFile(delete=False)

    return label_convert

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='parse xmfa file')
    parser.add_argument('xmfa', type=file, help='xmfa file')
    parser.add_argument('fasta', type=file, help='fasta file')
    args = parser.parse_args()

    label_convert = id_tn_dict(args.fasta)
    lcbs = parse_xmfa(args.xmfa)
    for lcb in lcbs:
        if len(lcb) > 1:
            for num, x in enumerate(lcb):
                lcb[num]['id'] = label_convert[x['id']]['record_id']
            print lcb
            print '\n'
